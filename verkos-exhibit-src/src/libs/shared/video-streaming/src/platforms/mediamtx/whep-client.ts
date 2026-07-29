import { WHEP_RETRY_DELAY } from './mediamtx-constants';

const Extensions: {
  Core: {
    ServerSentEvents: string;
    Layer: string;
  };
} = {
  Core: {
    ServerSentEvents: 'urn:ietf:params:whep:ext:core:server-sent-events',
    Layer: 'urn:ietf:params:whep:ext:core:layer',
  },
};

export class WHEPClient extends EventTarget {
  private token: string | null = null;
  private pc: RTCPeerConnection | null = null;
  private candidates: RTCIceCandidate[] = [];
  private endOfCandidates = false;
  private iceTrickleTimeout: NodeJS.Timeout | null = null;
  private restartIce = false;
  private resourceURL: URL | null = null;
  private eventsUrl: URL | null = null;
  private layerUrl: URL | null = null;
  private eventSource: EventSource | null = null;
  private iceUsername: string | null = null;
  private icePassword: string | null = null;
  private etag: string | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  onOffer: (offer: RTCSessionDescriptionInit) => RTCSessionDescriptionInit;
  onAnswer: (answer: RTCSessionDescriptionInit) => RTCSessionDescriptionInit;

  constructor() {
    super();
    this.iceUsername = null;
    this.icePassword = null;
    this.candidates = [];
    this.endOfCandidates = false;

    this.onOffer = (offer: RTCSessionDescriptionInit) => offer;
    this.onAnswer = (answer: RTCSessionDescriptionInit) => answer;
  }

  throwWithResponse(msg: string, response: any): never {
    const e = new Error(msg);
    (e as any).response = response;
    throw e;
  }

  async view(
    pc: RTCPeerConnection,
    url: string,
    streamId: string,
    token?: string
  ): Promise<void> {
    if (this.pc) {
      throw new Error('[WHEPClient] Already viewing');
    }

    this.token = token || null;
    this.pc = pc;

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        if (
          event.candidate.sdpMLineIndex &&
          event.candidate.sdpMLineIndex > 0
        ) {
          return;
        }
        this.candidates.push(event.candidate);
      } else {
        this.endOfCandidates = true;
      }

      if (!this.iceTrickleTimeout && !this.restartIce) {
        this.iceTrickleTimeout = setTimeout(() => this.patch(), 0);
      }
    };

    const offer = await pc.createOffer();
    offer.sdp = this.onOffer(offer.sdp as unknown as any) as any;

    const headers: Record<string, string> = {
      'Content-Type': 'application/sdp',
    };

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const fetchWithRetry = async (
      url: string,
      options: RequestInit,
      retries = Infinity,
      initialDelay = WHEP_RETRY_DELAY.INITIAL,
      maxDelay = WHEP_RETRY_DELAY.MAX
    ): Promise<Response> => {
      let attempt = 0;

      while (attempt < retries) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(
              `[WHEPClient] Request rejected with status ${response.status}`
            );
          }
          return response;
        } catch (error) {
          attempt++;
          if (attempt >= retries) {
            console.error('[WHEPClient] Max retries reached. Failed to fetch.');
            throw error;
          }
          // Exponential backoff: 2s, 4s, 8s, 16s, 30s (capped)
          const exponentialDelay = Math.min(
            initialDelay * Math.pow(2, attempt - 1),
            maxDelay
          );
          console.error(
            `[WHEPClient] Fetch attempt ${attempt} failed, retrying in ${exponentialDelay}ms...`,
            streamId
          );
          await new Promise((resolve) => {
            this.timeoutId = setTimeout(() => {
              resolve(null);
            }, exponentialDelay);
          });
        }
      }

      throw new Error('[WHEPClient] Unexpected error in fetchWithRetry');
    };

    const fetched = await fetchWithRetry(url, {
      method: 'POST',
      body: offer.sdp,
      headers,
    });

    if (!fetched.ok) {
      this.throwWithResponse(
        `[WHEPClient] Request rejected with status ${fetched.status}`,
        fetched
      );
    }
    if (!fetched.headers.get('location')) {
      this.throwWithResponse(
        '[WHEPClient] Response missing location header',
        fetched
      );
    }

    this.resourceURL = new URL(fetched.headers.get('location')!, url);

    const links: Record<
      string,
      { url: string; params: Record<string, string> }[]
    > = {};

    if (fetched.headers.has('link')) {
      const linkHeaders = fetched.headers.get('link')!.split(/,\s+(?=<)/);

      for (const header of linkHeaders) {
        try {
          let rel: string | undefined;
          const params: Record<string, string> = {};
          const items = header.split(';');
          const url = items[0]
            .trim()
            .replace(/<(.*)>/, '$1')
            .trim();

          for (let i = 1; i < items.length; ++i) {
            const [key, value] = items[i].split(/=(.*)/).map((v) => v.trim());
            if (key === 'rel') {
              rel = value.replace(/["']/g, '');
            } else {
              params[key] = value.replace(/["']/g, '');
            }
          }

          if (!rel) {
            continue;
          }
          if (!links[rel]) {
            links[rel] = [];
          }
          links[rel].push({ url, params });
        } catch (e) {
          console.error('[WHEPClient] Error parsing link header', e);
        }
      }
    }

    if (links[Extensions.Core.ServerSentEvents]) {
      this.eventsUrl = new URL(
        links[Extensions.Core.ServerSentEvents][0].url,
        url
      );
    }
    if (links[Extensions.Core.Layer]) {
      this.layerUrl = new URL(links[Extensions.Core.Layer][0].url, url);
    }

    if (this.eventsUrl) {
      const events = links[Extensions.Core.ServerSentEvents][0].params[
        'events'
      ]?.split(',') || ['active', 'inactive', 'layers', 'viewercount'];

      const eventHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        eventHeaders['Authorization'] = 'Bearer ' + this.token;
      }

      fetch(this.eventsUrl.toString(), {
        method: 'POST',
        body: JSON.stringify(events),
        headers: eventHeaders,
      }).then((eventFetch) => {
        if (!eventFetch.ok) {
          return;
        }
        const sseUrl = new URL(
          eventFetch.headers.get('location')!,
          this.eventsUrl!
        );
        this.eventSource = new EventSource(sseUrl.toString());
        this.eventSource.onmessage = (event) => this.dispatchEvent(event);
      });
    }

    const config = pc.getConfiguration();
    if (
      (!config.iceServers || !config.iceServers.length) &&
      links['ice-server']
    ) {
      config.iceServers = links['ice-server'].map((server) => {
        const iceServer: RTCIceServer = { urls: server.url };
        for (const [key, value] of Object.entries(server.params)) {
          const camelCaseKey = key.replace(/([-_][a-z])/gi, (match) =>
            match.toUpperCase().replace(/[-_]/, '')
          );
          (iceServer as any)[camelCaseKey] = value;
        }
        return iceServer;
      });

      if (config.iceServers.length) {
        pc.setConfiguration(config);
      }
    }

    const answer = await fetched.text();

    if (!this.iceTrickleTimeout) {
      this.iceTrickleTimeout = setTimeout(() => this.patch(), 0);
    }

    await pc.setLocalDescription(offer);

    this.iceUsername = offer.sdp!.match(/a=ice-ufrag:(.*)\r\n/)![1];
    this.icePassword = offer.sdp!.match(/a=ice-pwd:(.*)\r\n/)![1];

    await pc.setRemoteDescription({
      type: 'answer',
      sdp: this.onAnswer({ type: 'answer', sdp: answer }).sdp,
    });
  }

  async patch(): Promise<void> {
    if (this.iceTrickleTimeout) {
      clearTimeout(this.iceTrickleTimeout);
      this.iceTrickleTimeout = null;
    }

    if (
      !(this.candidates.length || this.endOfCandidates || this.restartIce) ||
      !this.resourceURL
    ) {
      return;
    }

    const candidates = this.candidates;
    const endOfcandidates = this.endOfCandidates;
    const restartIce = this.restartIce;

    this.candidates = [];
    this.endOfCandidates = false;

    let fragment =
      'a=ice-ufrag:' +
      this.iceUsername +
      '\r\n' +
      'a=ice-pwd:' +
      this.icePassword +
      '\r\n';

    const transceivers = this.pc!.getTransceivers();
    const medias: {
      [key: string]: {
        mid: string;
        kind: string;
        candidates: RTCIceCandidate[];
      };
    } = {};

    if (candidates.length || endOfcandidates) {
      medias[transceivers[0].mid!] = {
        mid: transceivers[0].mid!,
        kind: transceivers[0].receiver.track.kind,
        candidates: [],
      };
    }

    for (const candidate of candidates) {
      const mid = candidate.sdpMid!;
      const transceiver = transceivers.find((t) => t.mid === mid);
      let media = medias[mid];

      if (!media) {
        media = medias[mid] = {
          mid,
          kind: transceiver?.receiver.track.kind ?? '',
          candidates: [],
        };
      }
      media.candidates.push(candidate);
    }

    for (const media of Object.values(medias)) {
      fragment +=
        `m=${media.kind} 9 UDP/TLS/RTP/SAVPF 0\r\n` + `a=mid:${media.mid}\r\n`;
      for (const candidate of media.candidates) {
        fragment += `a=${candidate.candidate}\r\n`;
      }
      if (endOfcandidates) {
        fragment += 'a=end-of-candidates\r\n';
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/trickle-ice-sdpfrag',
    };

    if (restartIce) {
      headers['If-Match'] = '*';
    } else if (this.etag) {
      headers['If-Match'] = this.etag;
    }

    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token;
    }

    const fetched = await fetch(this.resourceURL!, {
      method: 'PATCH',
      body: fragment,
      headers,
    });

    if (!fetched.ok && fetched.status !== 501 && fetched.status !== 405) {
      this.throwWithResponse(
        `[WHEPClient] Request rejected with status ${fetched.status}`,
        fetched
      );
    }

    if (restartIce && fetched.status === 200) {
      this.etag = fetched.headers.get('etag');

      const answer = await fetched.text();
      const iceUsername = answer.match(/a=ice-ufrag:(.*)\r\n/)![1];
      const icePassword = answer.match(/a=ice-pwd:(.*)\r\n/)![1];
      const candidates = Array.from(
        answer.matchAll(/(a=candidate:.*\r\n)/gm)
      ).map((res) => res[1]);

      const remoteDescription = this.pc!.remoteDescription as any;
      remoteDescription.sdp = remoteDescription.sdp.replaceAll(
        /(a=ice-ufrag:)(.*)\r\n/gm,
        `$1${iceUsername}\r\n`
      );
      remoteDescription.sdp = remoteDescription.sdp.replaceAll(
        /(a=ice-pwd:)(.*)\r\n/gm,
        `$1${icePassword}\r\n`
      );
      remoteDescription.sdp = remoteDescription.sdp.replaceAll(
        /(a=candidate:.*\r\n)/gm,
        ''
      );
      remoteDescription.sdp = remoteDescription.sdp.replaceAll(
        /(m=.*\r\n)/gm,
        `$1${candidates.join('')}`
      );

      await this.pc!.setRemoteDescription(remoteDescription);

      if (this.restartIce === restartIce) {
        this.restartIce = false;
        if (this.candidates.length || this.endOfCandidates) {
          this.patch();
        }
      }
    }
  }

  async stop(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.iceTrickleTimeout) {
      clearTimeout(this.iceTrickleTimeout);
      this.iceTrickleTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (!this.pc) {
      return;
    }

    this.pc.close();
    this.pc = null;

    if (!this.resourceURL) {
      throw new Error('[WHEPClient] WHEP resource url not available yet');
    }

    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(this.resourceURL, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `[WHEPClient] Failed to stop resource: ${response.statusText}`
      );
    }
  }
}
