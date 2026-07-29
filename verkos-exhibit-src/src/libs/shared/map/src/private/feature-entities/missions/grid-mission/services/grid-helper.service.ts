import { v4 as uuidv4 } from 'uuid';
import { IPosition } from '@map/public/contracts';

export interface WaypointFE {
  id: string;
  lat: number;
  lng: number;
  alt?: number;
  altDefault?: boolean;
  speedDefault?: boolean;
  waypointTurnTypeDefault?: boolean;
  actions?: unknown[];
}

export class GridHelper {
  private M_PI = 3.1415926535;
  private M_DEG_TO_RAD = this.M_PI / 180.0;
  private M_RAD_TO_DEG = 180.0 / this.M_PI;
  private CONSTANTS_RADIUS_OF_EARTH = 6371000;
  private surveyPolygonMrkerLabel = 0;
  private waypointMarkers: any[] = [];
  private polygonMarkers: any[] = [];
  private plottable_wp: any;
  private ordered_transect_lines: any;
  private overshoot1: any;
  private overshoot2: any;
  private transect_points: any[] = [];
  private result_lines: any;
  private polyned: any;
  private intersect_lines: any;
  private transect_lines: any;
  public polypath: IPosition[] | undefined;
  private leadin: any;

  private _spacing: number | undefined;
  private _angle: number | undefined;

  get gridSpacing(): number | undefined {
    return this._spacing;
  }

  set gridSpacing(val: number | undefined) {
    this._spacing = val;
  }

  get gridAngle(): number | undefined {
    return this._angle;
  }

  set gridAngle(val: number | undefined) {
    this._angle = val;
  }

  private nedWaypoints: { x: number; y: number; is_camera: boolean }[] = [];
  private waypoints: WaypointFE[] = [];
  private geoWaypoints: { lat: number; lng: number; is_camera: boolean }[] = [];

  private _startPoint = 0;

  get startPoint(): number {
    return this._startPoint;
  }

  set startPoint(val: number) {
    this._startPoint = val;
  }

  private adjustTransectsToEntryPointLocation() {
    if (this.transect_points.length === 0) {
      return;
    }
    // fetch entry point from user
    const entryLocation = Number(this._startPoint);
    let reversePoints = false;
    let reverseTransects = false;

    const position1 = 2;
    const position2 = 1;
    const position3 = 3;
    const position4 = 0;

    if (entryLocation === position1) {
      return;
    }
    if (entryLocation === position2 || entryLocation === position3) {
      reversePoints = true;
    }
    if (entryLocation === position3 || entryLocation === position4) {
      reverseTransects = true;
    }

    if (reversePoints) {
      this.reverseInternalTransectPoints();
    }
    if (reverseTransects) {
      this.reverseTransectOrder();
    }
  }

  /// Reverse the order of the transects. First transect becomes last and so forth.
  private reverseTransectOrder() {
    const rgReversedTransects = [];
    for (let i = this.transect_points.length - 1; i >= 0; i--) {
      rgReversedTransects.push(this.transect_points[i]);
    }
    this.transect_points = rgReversedTransects;
  }

  /// Reverse the order of all points withing each transect, First point becomes last and so forth.
  private reverseInternalTransectPoints() {
    for (let i = 0; i < this.transect_points.length; i++) {
      const rgReversedCoords = [];
      const rgOriginalCoords = this.transect_points[i];
      for (let j = rgOriginalCoords.length - 1; j >= 0; j--) {
        rgReversedCoords.push(rgOriginalCoords[j]);
      }
      this.transect_points[i] = rgReversedCoords;
    }
  }

  private convertTransectsToOrderedTransects() {
    this.ordered_transect_lines = [];
    for (let i = 0; i < this.transect_points.length; i++) {
      const transect_line = this.transect_points[i];
      if (transect_line.length < 2) {
        continue;
      }

      const ordered_transect_line = {
        start: {
          x: transect_line[0].x,
          y: transect_line[0].y,
        },
        end: {
          x: transect_line[1].x,
          y: transect_line[1].y,
        },
      };
      this.ordered_transect_lines.push(ordered_transect_line);
    }
  }

  private create_transects() {
    this.transect_points = [];
    for (let i = 0; i < this.result_lines.length; i++) {
      let transect_line: any = {};
      const transect_points = [];
      const line = this.result_lines[i];
      if (i % 2 === 1) {
        transect_line = { start: line.end, end: line.start };
      } else {
        transect_line = { start: line.start, end: line.end };
      }

      transect_points.push({
        x: transect_line.start.x,
        y: transect_line.start.y,
        is_camera: false,
      });
      transect_points.push({
        x: transect_line.end.x,
        y: transect_line.end.y,
        is_camera: false,
      });
      this.transect_points.push(transect_points);
    }

    this.adjustTransectsToEntryPointLocation();
    this.convertTransectsToOrderedTransects();
    this.transect_lines = [];

    for (let i = 0; i < this.ordered_transect_lines.length; i++) {
      const transect_points = [];
      const transect_line = this.ordered_transect_lines[i];

      const line_ang = Math.atan2(
        transect_line.end.y - transect_line.start.y,
        transect_line.end.x - transect_line.start.x
      );
      if (this.leadin > 0) {
        const leadin_point = {
          x: transect_line.start.x - this.leadin * Math.cos(line_ang),
          y: transect_line.start.y - this.leadin * Math.sin(line_ang),
          is_camera: false,
        };
        transect_points.push(leadin_point);
      }

      transect_points.push({
        x: transect_line.start.x,
        y: transect_line.start.y,
        is_camera: false,
      });
      transect_points.push({ x: 0, y: 0, is_camera: true });
      transect_points.push({
        x: transect_line.end.x,
        y: transect_line.end.y,
        is_camera: false,
      });
      transect_points.push({ x: 0, y: 0, is_camera: true });

      if (i % 2 === 1) {
        if (this.overshoot1 > 0) {
          const overshoot_point = {
            x: transect_line.end.x + this.overshoot1 * Math.cos(line_ang),
            y: transect_line.end.y + this.overshoot1 * Math.sin(line_ang),
            is_camera: false,
          };
          transect_points.push(overshoot_point);
        }
      } else {
        if (this.overshoot2 > 0) {
          const overshoot_point = {
            x: transect_line.end.x + this.overshoot2 * Math.cos(line_ang),
            y: transect_line.end.y + this.overshoot2 * Math.sin(line_ang),
            is_camera: false,
          };
          transect_points.push(overshoot_point);
        }
      }
      this.transect_lines.push(transect_points);
    }
  }

  private geotoned(lat: number, lng: number, org_lat: number, org_lng: number) {
    if (org_lat === lat && org_lng === lng) {
      return { x: 0, y: 0 };
    }

    const lat_rad = lat * this.M_DEG_TO_RAD;
    const lon_rad = lng * this.M_DEG_TO_RAD;

    const ref_lat_rad = org_lat * this.M_DEG_TO_RAD;
    const ref_lon_rad = org_lng * this.M_DEG_TO_RAD;

    const sin_lat = Math.sin(lat_rad);
    const cos_lat = Math.cos(lat_rad);
    const cos_d_lon = Math.cos(lon_rad - ref_lon_rad);

    const ref_sin_lat = Math.sin(ref_lat_rad);
    const ref_cos_lat = Math.cos(ref_lat_rad);
    const c = Math.acos(
      ref_sin_lat * sin_lat + ref_cos_lat * cos_lat * cos_d_lon
    );
    const k = Math.abs(c) < Number.EPSILON ? 1.0 : c / Math.sin(c);
    const x =
      k *
      (ref_cos_lat * sin_lat - ref_sin_lat * cos_lat * cos_d_lon) *
      this.CONSTANTS_RADIUS_OF_EARTH;
    const y =
      k *
      cos_lat *
      Math.sin(lon_rad - ref_lon_rad) *
      this.CONSTANTS_RADIUS_OF_EARTH;
    return { x: x, y: y };
  }

  private nedtogeo(x: number, y: number, org_lat: number, org_lng: number) {
    const x_rad = x / this.CONSTANTS_RADIUS_OF_EARTH;
    const y_rad = y / this.CONSTANTS_RADIUS_OF_EARTH;
    const c = Math.sqrt(x_rad * x_rad + y_rad * y_rad);
    const sin_c = Math.sin(c);
    const cos_c = Math.cos(c);
    const ref_lon_rad = org_lng * this.M_DEG_TO_RAD;
    const ref_lat_rad = org_lat * this.M_DEG_TO_RAD;
    const ref_sin_lat = Math.sin(ref_lat_rad);
    const ref_cos_lat = Math.cos(ref_lat_rad);
    let lat_rad;
    let lon_rad;
    if (Math.abs(c) > Number.EPSILON) {
      lat_rad = Math.asin(
        cos_c * ref_sin_lat + (x_rad * sin_c * ref_cos_lat) / c
      );
      lon_rad =
        ref_lon_rad +
        Math.atan2(
          y_rad * sin_c,
          c * ref_cos_lat * cos_c - x_rad * ref_sin_lat * sin_c
        );
    } else {
      lat_rad = ref_lat_rad;
      lon_rad = ref_lon_rad;
    }
    const lat = lat_rad * this.M_RAD_TO_DEG;
    const lng = lon_rad * this.M_RAD_TO_DEG;
    return { lat: lat, lng: lng };
  }
  private convert_path_to_geo() {
    this.geoWaypoints = [];

    // Check if polypath exists and has at least one point
    if (!this.polypath || this.polypath.length === 0) {
      return;
    }

    const originPoint = this.polypath[0];

    for (let i = 0; i < this.nedWaypoints.length; i++) {
      const geoPoint = this.nedtogeo(
        this.nedWaypoints[i].x,
        this.nedWaypoints[i].y,
        originPoint.latitude,
        originPoint.longitude
      );
      this.geoWaypoints.push({
        ...geoPoint,
        is_camera: this.nedWaypoints[i].is_camera,
      });
    }
  }

  private plot_waypoints(): void {
    this.plottable_wp = [];

    for (let i = 0; i < this.geoWaypoints.length; i++) {
      if (!this.geoWaypoints[i].is_camera) {
        // this.window_show = this.state.waypoints.length;
        this.plottable_wp.push({
          lat: this.geoWaypoints[i].lat,
          lng: this.geoWaypoints[i].lng,
        });
      }
    }
  }

  private rotate(
    pointX: number,
    pointY: number,
    centerX: number,
    centerY: number,
    angle: number
  ): { x: number; y: number } {
    // convert angle to radians
    // reverting angle orientation for correct UI behaviour
    angle = (-angle * Math.PI) / 180.0;
    // get coordinates relative to center
    const dx = pointX - centerX;
    const dy = pointY - centerY;
    // calculate angle and distance
    const a = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy);
    // calculate new angle
    const a2 = a + angle;
    // calculate new coordinates
    const dx2 = Math.cos(a2) * dist;
    const dy2 = Math.sin(a2) * dist;
    // return coordinates relative to top left corner
    return { x: dx2 + centerX, y: dy2 + centerY };
  }

  private find_intersect_points(start1: any, end1: any): any[] {
    const poly = this.polyned;
    let start2, end2;
    const intersections = [];
    for (let i = 0; i < poly.length; i++) {
      start2 = poly[i];
      if (i !== poly.length - 1) {
        end2 = poly[i + 1];
      } else {
        end2 = poly[0];
      }
      const myxy = this.get_line_intersects(start1, end1, start2, end2);
      if (myxy !== null) {
        intersections.push(myxy);
      }
    }
    return intersections;
  }

  private get_line_intersects(
    start1: any,
    end1: any,
    start2: any,
    end2: any
  ): { x: number; y: number } | null {
    const denom =
      (end1.y - start1.y) * (end2.x - start2.x) -
      (end1.x - start1.x) * (end2.y - start2.y);
    if (denom === 0) {
      return null;
    } else {
      const numer =
        (start1.x - start2.x) * (end2.y - start2.y) -
        (start1.y - start2.y) * (end2.x - start2.x);

      const r = numer / denom;
      const numer2 =
        (start1.x - start2.x) * (end1.y - start1.y) -
        (start1.y - start2.y) * (end1.x - start1.x);
      const s = numer2 / denom;

      if (r < 0 || r > 1 || s < 0 || s > 1) {
        return null;
      } else {
        // Find intersection point
        const y = start1.y + r * (end1.y - start1.y);
        const x = start1.x + r * (end1.x - start1.x);

        return { x: x, y: y };
      }
    }
  }
  private get_intersect_lines(linelist: any): void {
    this.intersect_lines = [];
    for (let k = 0; k < linelist.length; k++) {
      const point1 = linelist[k].start;
      const point2 = linelist[k].end;
      const intersections = this.find_intersect_points(point1, point2);
      if (intersections.length > 1) {
        let first_point,
          second_point = [];
        let current_max_dist = 0;
        for (let i = 0; i < intersections.length; i++) {
          for (let j = 0; j < intersections.length; j++) {
            if (i === j) {
              continue;
            }
            const new_max_dist =
              Math.pow(intersections[j].x - intersections[i].x, 2) +
              Math.pow(intersections[j].y - intersections[i].y, 2);
            if (new_max_dist > current_max_dist) {
              current_max_dist = new_max_dist;
              first_point = intersections[i];
              second_point = intersections[j];
            }
          }
        }
        this.intersect_lines.push({ start: first_point, end: second_point });
      }
    }
  }
  private clampGridAngle90(gridAngle: number): number {
    // Clamp grid angle to -90<->90. This prevents transects from being rotated to a reversed order.
    if (gridAngle > 90.0) {
      gridAngle -= 180.0;
    } else if (gridAngle < -90.0) {
      gridAngle += 180;
    }
    return gridAngle;
  }

  private adjust_line_direction(): void {
    this.result_lines = [];
    let first_ang = 0;
    for (let i = 0; i < this.intersect_lines.length; i++) {
      const line = this.intersect_lines[i];
      let adjusted_line: any = [];
      if (i === 0) {
        first_ang = Math.atan2(
          line.end.y - line.start.y,
          line.end.x - line.start.x
        );
        if (first_ang < 0) {
          first_ang += Math.PI;
        }
      }
      let line_ang = Math.atan2(
        line.end.y - line.start.y,
        line.end.x - line.start.x
      );
      if (line_ang < 0) {
        line_ang += 2 * Math.PI;
      }
      // check if difference of angle is greater than 1 rad and less than 5 rad.
      // < 5rad is added as atan2 returns value from -Pi to Pi, and 2*Pi ~ 6rad
      if (Math.abs(line_ang - first_ang) > 1) {
        adjusted_line = { start: line.end, end: line.start };
      } else {
        adjusted_line = line;
      }
      this.result_lines.push(adjusted_line);
    }
  }

  private create_path(): void {
    this.nedWaypoints = [];
    for (let i = 0; i < this.transect_lines.length; i++) {
      for (let j = 0; j < this.transect_lines[i].length; j++) {
        this.nedWaypoints.push(this.transect_lines[i][j]);
      }
    }
  }

  private create_mission(altitude?: number): void {
    this.waypoints = [];
    for (let i = 0; i < this.geoWaypoints.length; i++) {
      if (!this.geoWaypoints[i].is_camera) {
        const waypoint: WaypointFE = {
          id: uuidv4(),
          lat: this.geoWaypoints[i].lat,
          lng: this.geoWaypoints[i].lng,
          alt: altitude || 0,
          altDefault: true,
          speedDefault: true,
          waypointTurnTypeDefault: true,
          actions: [],
        };
        this.waypoints.push(waypoint);
      }
    }
  }

  generateWaypoints(altitude?: number): WaypointFE[] {
    // Check if polypath exists and has at least one point
    if (!this.polypath || this.polypath.length === 0) {
      return [];
    }

    // Check if gridSpacing is defined
    if (this.gridSpacing === undefined) {
      return [];
    }

    const poly: { lat: number; lng: number }[] = [];
    this.polypath.forEach((value, index) => {
      poly[index] = { lat: value.latitude, lng: value.longitude };
    });

    if (poly[poly.length - 1] !== poly[0]) {
      poly.push(poly[0]);
    }

    // todo: linespacing <= 0 then return;
    this.polyned = [];
    this.intersect_lines = [];
    let linelist = [];

    for (let i = 0; i < poly.length; i++) {
      const xy = this.geotoned(
        poly[i].lat,
        poly[i].lng,
        poly[0].lat,
        poly[0].lng
      );
      this.polyned.push(xy);
    }
    const gridang = this.clampGridAngle90(this.gridAngle || 0);
    const all_x = [];
    const all_y = [];
    for (let i = 0; i < this.polyned.length; i++) {
      all_x.push(this.polyned[i].x);
      all_y.push(this.polyned[i].y);
    }

    const bb_x1 = Math.min(...all_x);
    const bb_x2 = Math.max(...all_x);
    const bb_y1 = Math.min(...all_y);
    const bb_y2 = Math.max(...all_y);

    const bb_center = { x: (bb_x1 + bb_x2) / 2, y: (bb_y1 + bb_y2) / 2 };

    const max_width = Math.max(bb_x2 - bb_x1, bb_y2 - bb_y1) * 2.0;
    const half_width = max_width / 2;

    let transectX = bb_center.x - half_width;
    const transectXMax = transectX + max_width;

    while (transectX < transectXMax) {
      const transectYTop = bb_center.y - half_width;
      const transectYBottom = bb_center.y + half_width;
      const start = this.rotate(
        transectX,
        transectYTop,
        bb_center.x,
        bb_center.y,
        gridang
      );
      const end = this.rotate(
        transectX,
        transectYBottom,
        bb_center.x,
        bb_center.y,
        gridang
      );
      linelist.push({ start: start, end: end });
      transectX += this.gridSpacing;
    }

    this.get_intersect_lines(linelist);
    if (this.intersect_lines.length < 2 && linelist.length > 0) {
      const line: any = linelist[0];

      const line_center = {
        x: (line.start.x + line.end.x) / 2,
        y: (line.start.y + line.end.y) / 2,
      };
      const center_offset = {
        x: bb_center.x - line_center.x,
        y: bb_center.y - line_center.y,
      };
      const new_line = {
        start: {
          x: line.start.x + center_offset.x,
          y: line.start.y + center_offset.y,
        },
        end: {
          x: line.end.x + center_offset.x,
          y: line.end.y + center_offset.y,
        },
      };
      linelist = [];
      linelist.push(new_line);
      this.get_intersect_lines(linelist);
    }

    this.adjust_line_direction();

    this.create_transects();
    this.create_path();
    this.convert_path_to_geo();
    this.plot_waypoints();
    this.create_mission(altitude);
    return this.waypoints;
  }
}
