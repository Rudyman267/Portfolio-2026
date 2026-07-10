"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { whenHeroVideoReady } from "@/components/motion/heroReady";

/** Fired on window when the intro finishes so the hero can begin its reveal. */
export const LOADER_DONE_EVENT = "loader:done";

/**
 * Frying-pan intro — this IS the loader (Figma 124:80).
 *
 * A white line-art frying pan sits centred on a black void, tossing a pancake
 * in a loop while the page loads. "cooking" (EB Garamond italic) sits beneath
 * it and a huge bold counter runs in the bottom-left corner. The counter
 * reflects REAL loading (eases to 90, holds for the hero, then 90→100); when
 * it lands the label swaps to "click to enter" and the counter fades.
 *
 * On click the pan gives one final flick — the pancake sails off the top of
 * the screen — and the black overlay opens a circular hole from the pan's
 * position that expands until the hero underneath fills the viewport.
 * NO white flash anywhere: the hero is revealed directly through the shape.
 *
 * Runs once per full page load. Emits `LOADER_DONE_EVENT` partway through the
 * reveal so the hero headline rises while it's being unveiled. Reduced-motion
 * users skip it entirely and see the site immediately.
 */

/** Figma line-art pan (Group 9, viewBox 284.897 × 113.313), inlined so GSAP
 *  can drive it directly and the strokes stay crisp at any size. */
function PanArt() {
  return (
    <svg
      className="pan__svg block w-full overflow-visible will-change-transform"
      viewBox="0 0 284.897 113.313"
      fill="none"
      aria-hidden="true"
      // Pivot at the HANDLE end (far-right of the viewBox, where a hand would
      // grip it) so the toss rotates/lifts around the handle, not the bowl.
      style={{ transformOrigin: "90% 10%" }}
    >
      <path
        d="M267.66 0.230469V0.231445C270.614 0.282435 273.541 0.379531 276.521 0.634766V0.635742H276.535C278.356 0.682981 280.483 1.67559 282.111 3.16504C283.741 4.65579 284.825 6.59928 284.649 8.51855C284.507 10.0861 283.661 11.3455 282.367 12.375C281.07 13.4072 279.334 14.1988 277.445 14.8223C273.661 16.0715 269.355 16.622 266.869 17.1318C255.016 19.5636 243.302 21.5637 232.064 26.3047C222.95 30.1508 215.759 35.9156 208.452 42.3232L208.39 42.3779L208.377 42.4609C205.376 62.7347 198.109 78.6875 186.521 90.1865C174.934 101.685 159.005 108.751 138.644 111.214C108.653 114.84 76.662 113.586 47.7891 103.969C39.2811 101.133 30.7636 95.7951 23.6455 90.4766H23.6445C22.921 89.9215 20.5599 88.0835 18.2988 86.248C17.1665 85.3289 16.0606 84.4111 15.1992 83.6563C14.7684 83.2787 14.4 82.9434 14.1211 82.6699C13.8351 82.3895 13.6626 82.192 13.6006 82.0859C8.45967 73.342 5.12215 63.3719 1.95703 53.7891C-0.0555058 47.6959 -0.211146 42.6435 0.977539 38.4131C2.16611 34.1831 4.70523 30.7519 8.12012 27.9121C14.96 22.2242 25.2839 18.9297 35.1934 16.3643L35.1943 16.3652C49.415 12.8326 63.9456 10.6937 78.5791 9.98047L79.9961 9.91602C104.564 8.81361 129.792 11.3299 153.949 15.7979C163.924 17.6425 174.383 20.0339 183.883 23.5342C188.609 25.2752 192.343 27.3156 196.675 29.8633L196.796 29.9346L196.914 29.8594C218.449 16.0793 238.785 2.03093 264.933 0.317383H264.935C265.842 0.248163 266.753 0.218519 267.66 0.230469Z"
        stroke="white"
        strokeWidth="0.457294"
      />
      <path
        d="M80.7509 10.6253C110.794 9.37656 142.751 13.368 171.992 20.5853C173.256 20.8971 174.522 21.4312 175.801 21.9945C177.073 22.5548 178.36 23.1446 179.639 23.5511V23.5521C189.799 26.856 201.122 32.3243 203.879 43.5472C204.684 46.8264 203.94 50.8011 201.963 53.5491C197.622 59.4394 189.508 63.9119 180.778 67.221C172.602 70.3204 163.92 72.3862 157.379 73.6448L156.1 73.8861C144.3 75.9644 132.355 77.1166 120.375 77.3333H120.373C107.338 77.6905 86.5401 77.2273 66.2802 74.806C56.1503 73.5953 46.1586 71.8952 37.3417 69.5657C28.5217 67.2355 20.8922 64.2791 15.4745 60.5618C11.2507 57.6644 7.66072 53.7734 6.7411 48.6312C5.8089 43.4192 7.69836 38.1481 10.7011 33.8792C17.225 24.6054 29.084 19.0304 40.0634 17.2044C41.8094 16.914 44.0599 16.6083 46.2421 16.6439C48.4311 16.6796 50.5125 17.0593 51.952 18.1048C52.743 18.6791 53.2374 19.4024 53.4003 20.3607C53.6133 21.6152 53.2845 23.202 52.5936 24.9632C51.9051 26.7183 50.8689 28.6178 49.703 30.4866C47.371 34.2247 44.5369 37.8122 42.9725 39.8362C39.7631 43.9885 36.3899 47.9686 33.1337 52.0989L32.7938 52.5286L33.3388 52.4671C56.6639 49.8381 79.4126 45.2939 102.991 43.845C126.443 42.4039 151.055 42.409 170.662 57.1458L171.592 57.8587C172.559 58.6146 173.483 59.4506 174.415 60.2884C175.344 61.124 176.282 61.9612 177.267 62.7073L177.348 62.7679L177.446 62.7503L177.769 62.6907L178.017 62.6458L177.948 62.4027C177.849 62.0582 177.593 61.6649 177.247 61.2474C176.896 60.8246 176.435 60.3568 175.897 59.8636C174.822 58.8768 173.429 57.7735 171.98 56.7025C169.084 54.5612 165.942 52.5319 164.623 51.7952C151.051 44.2131 135.06 41.8907 118.786 41.8997C102.514 41.9088 85.9317 44.25 71.1796 46.013C60.5214 47.2868 45.9509 49.1846 35.4813 51.0277C39.0521 46.7541 47.5444 37.2133 51.8036 29.1273C52.9115 27.0239 53.7399 25.0062 54.119 23.1966C54.4976 21.3892 54.4327 19.7618 53.7196 18.4622C53.0024 17.1553 51.6544 16.2251 49.5653 15.765C47.5053 15.3113 44.7062 15.3096 41.0243 15.8577L40.9198 15.7249C54.0308 12.9141 67.355 11.2076 80.7518 10.6263L80.7509 10.6253Z"
        stroke="white"
        strokeWidth="0.457294"
      />
      <path
        d="M270.645 1.30251C272.398 1.09002 276.346 1.02766 276.524 3.37912C276.168 4.2175 275.628 4.41249 274.842 4.85547C273.254 4.79754 269.215 3.53762 268.665 1.9321C269.198 1.30893 269.625 1.45264 270.645 1.30251Z"
        fill="white"
      />
      <path
        d="M30.8214 18.1032C32.5131 17.3321 38.6394 15.9829 40.5124 15.5779L40.9268 16.1032C37.1277 16.7962 34.7759 17.3407 31.1296 18.5863L30.8214 18.1032Z"
        fill="#B9BCBF"
      />
    </svg>
  );
}

/** Figma line-art fried egg (Group 11, viewBox 72.5054 × 68.3693) — the food
 *  the pan tosses. Inlined verbatim from the shared vector; CSS-var fills from
 *  the Figma export swapped for literal colors (yolk #FBC94A / #FDDC81, white
 *  line-art). The black backing ellipse occludes the pan's rim/floor lines
 *  behind the egg so it reads as sitting inside the bowl. */
function EggArt() {
  return (
    <svg
      className="block w-full overflow-visible"
      viewBox="0 0 72.5054 68.3693"
      fill="none"
      aria-hidden="true"
    >
      {/* occluder — sits behind the egg, hides the pan lines under it */}
      <ellipse cx="34" cy="38" rx="24" ry="18" fill="black" />
      <path
        d="M21.5767 25.1038C25.7661 21.4185 32.1643 20.2186 37.4455 21.9477C41.0962 23.2047 43.7852 25.9808 45.4518 29.4186C47.5011 33.6461 47.9322 38.4235 46.3799 42.8888C45.2095 46.2581 42.723 48.8734 39.5278 50.4165C35.2888 52.4643 29.6387 52.5656 25.215 51.0056C21.4645 49.6833 17.7417 47.2467 15.9966 43.5468C15.7325 42.9869 15.527 42.4209 15.4026 41.8135C14.9951 39.8225 14.4608 32.2459 12.4942 31.4234C11.8031 31.1343 10.7341 32.3545 10.279 31.5775C9.71622 30.6158 10.3295 27.9005 10.6479 26.8688C10.69 26.7295 10.7365 26.5914 10.7875 26.455C10.9703 26.7552 10.8807 26.7055 11.1539 26.8286C10.6173 28.6335 10.4922 29.578 10.6196 31.4646C11.1777 31.1961 11.9388 30.7439 12.5614 30.9729C14.0108 31.5061 14.5282 33.9023 14.8293 35.2176C15.1462 36.6656 15.4011 38.1267 15.5935 39.597C15.7318 40.6101 15.8469 41.97 16.2508 42.9041C17.7434 46.3562 21.3712 49.069 24.8039 50.3467C25.1716 50.4856 25.5452 50.6075 25.9236 50.7133C25.908 50.586 25.8905 50.4648 25.7485 50.4027C24.3267 49.7753 20.5816 47.4637 20.4144 45.8332C18.8964 43.8061 17.6941 42.0582 17.1644 39.5195C16.6273 37.4579 16.8145 34.6424 17.1972 32.5716C17.0117 31.3885 16.976 29.8491 18.3047 29.3257C19.0897 27.8443 20.2805 26.1491 21.5767 25.1038Z"
        fill="#FBC94A"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M42.461 32.1032C41.6465 32.2789 42.4855 33.5845 42.5684 34.3446C42.7402 35.91 42.7179 37.4792 41.9287 38.8981C41.2431 40.1313 40.0596 40.4519 38.9099 39.5745C36.5017 37.5866 33.4999 33.5308 32.149 30.8143C31.7955 30.1031 31.5401 29.3472 31.3898 28.5674C31.0624 26.8758 31.1911 24.7807 33.3154 24.497C35.6419 24.1862 37.3024 25.0784 39.1209 26.3906C41.2055 28.2745 42.2907 29.4093 42.9718 32.2529C42.7762 32.0998 42.7862 32.1015 42.5546 32.0169L42.461 32.1032Z"
        fill="#FDDC81"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M37.4451 21.948C41.0959 23.205 43.7849 25.9811 45.4515 29.4189C47.5008 33.6464 47.9318 38.4238 46.3795 42.8891C45.2091 46.2584 42.7226 48.8737 39.5274 50.4168C35.2884 52.4646 29.6384 52.5659 25.2147 51.0059C21.4641 49.6836 17.7414 47.247 15.9962 43.5471C15.7322 42.9873 15.5266 42.4212 15.4023 41.8138C14.9947 39.8228 14.4605 32.2462 12.4938 31.4237C11.8027 31.1346 10.7337 32.3548 10.2787 31.5778C9.71586 30.6161 10.3291 27.9008 10.6475 26.8691C10.6896 26.7298 10.7362 26.5917 10.7872 26.4553C10.9699 26.7555 10.8803 26.7058 11.1535 26.8289C10.617 28.6338 10.4918 29.5784 10.6193 31.4649C11.1773 31.1964 11.9384 30.7442 12.5611 30.9732C14.0105 31.5064 14.5278 33.9026 14.8289 35.2179C15.1458 36.6659 15.4008 38.127 15.5931 39.5973C15.7314 40.6104 15.8466 41.9703 16.2505 42.9044C17.7431 46.3565 21.3708 49.0693 24.8036 50.347C25.1713 50.4859 25.5448 50.6078 25.9233 50.7137C26.5707 50.9951 27.6028 51.1984 28.3025 51.3034C31.7567 51.8234 35.4625 51.6302 38.6961 50.268C41.9119 48.9074 44.4559 46.3259 45.7682 43.09C47.3551 39.1225 47.1281 34.523 45.4469 30.6273C43.7151 26.614 41.1987 23.9149 37.1314 22.2785C37.3055 22.1835 37.3186 22.119 37.4451 21.948Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M42.9854 37.3259C40.9537 44.7708 35.7729 37.2462 33.7926 34.3309C32.3201 32.1628 31.1379 30.5997 30.8486 27.8735C30.2728 22.4468 36.5605 23.5649 39.2656 25.9243C39.5678 26.5818 40.7673 27.2151 41.3149 28.1836L41.2727 28.1176C40.6868 27.8427 39.7933 26.4671 39.1222 26.3893C37.3037 25.077 35.6432 24.1849 33.3167 24.4956C31.1924 24.7793 31.0637 26.8744 31.3911 28.566C31.5414 29.3458 31.7968 30.1018 32.1503 30.813C33.5013 33.5295 36.503 37.5852 38.9113 39.5731C40.061 40.4505 41.2444 40.1299 41.93 38.8967C42.7192 37.4778 42.7415 35.9086 42.5697 34.3432C42.4869 33.5831 41.6478 32.2775 42.4623 32.1018L42.5559 32.0156C42.7875 32.1001 42.7775 32.0984 42.9731 32.2515L43.0046 32.2631C43.3811 34.1868 43.6312 35.3755 43.645 37.3934C43.5959 37.5806 43.5752 37.5959 43.4732 37.7639C43.3903 37.5277 43.385 37.3888 43.2346 37.2009L42.9854 37.3259Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M43.0039 32.2636C43.0783 31.9618 43.1021 32.006 43.3621 31.8723C44.2502 35.376 44.6529 41.3507 42.7562 44.5037C39.8747 49.2918 28.8852 51.7821 24.2565 48.7166C23.9883 48.4136 23.7544 48.3047 23.4361 48.0371C23.9947 48.0148 23.7904 48.3247 24.3053 48.251C26.5178 49.3225 28.2193 49.709 30.7513 49.6001C34.4592 49.4406 39.0617 47.9642 41.6771 45.2223C43.4365 43.3778 43.7624 39.8282 43.6443 37.3939C43.6305 35.376 43.3805 34.1872 43.0039 32.2636Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M21.5766 25.1041C21.6752 25.1644 21.8558 25.2669 21.941 25.3317C19.0074 28.1204 17.3294 31.9792 17.2903 36.0263C17.2663 37.4037 17.4348 38.4507 17.6993 39.7744C17.6016 40.3182 17.9091 40.533 17.8002 40.9563C17.5626 40.4938 17.4886 39.8404 17.1643 39.5198C16.6272 37.4582 16.8144 34.6427 17.1971 32.5719C17.0116 31.3888 16.9759 29.8494 18.3046 29.326C19.0896 27.8446 20.2804 26.1494 21.5766 25.1041Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M21.5762 25.1043C25.7656 21.419 32.1638 20.2191 37.445 21.9482C37.3184 22.1192 37.3054 22.1837 37.1313 22.2788C36.4993 22.0773 36.1496 21.9734 35.5023 21.8556C34.4316 21.6024 33.2024 21.5779 32.1087 21.5986C30.9338 21.6038 28.4559 21.929 27.3853 22.3865C25.8896 22.8679 24.0892 23.6442 22.8461 24.6287C22.4692 24.8884 22.2845 25.0359 21.9406 25.332C21.8554 25.2672 21.6747 25.1646 21.5762 25.1043Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M17.1644 39.5195C17.4887 39.8401 17.5627 40.4936 17.8002 40.9561C17.9092 40.5327 17.6017 40.3179 17.6994 39.7742C18.6416 42.6848 20.2832 45.3761 22.7976 47.2352C23.0318 47.4085 24.182 48.1118 24.305 48.2514C23.7901 48.325 23.9945 48.0152 23.4358 48.0374C23.7542 48.3051 23.9881 48.414 24.2562 48.717C22.7058 48.0397 21.6232 46.9384 20.4144 45.8332C18.8964 43.8061 17.6941 42.0582 17.1644 39.5195Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M39.2651 25.9247C41.3574 27.4543 42.8016 29.3088 43.3622 31.8722C43.1022 32.0059 43.0784 31.9617 43.004 32.2635L42.9726 32.2518C42.2915 29.4083 41.2063 28.2734 39.1217 26.3896C39.7928 26.4675 40.6863 27.843 41.2722 28.118L41.3144 28.184C40.7668 27.2154 39.5673 26.5821 39.2651 25.9247Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M1.84328 20.664C2.42832 18.2923 4.28851 14.0054 5.9282 12.3031C8.88508 9.23357 14.0718 8.72822 18.0659 8.2652C20.1578 8.02269 22.5149 6.22048 24.1269 4.99909C29.2724 1.14157 34.4756 -0.847709 40.9334 0.875121C46.7179 2.41848 50.6746 6.13864 54.3975 10.5841C57.0519 14.019 59.4548 15.7765 63.4814 17.4894C71.5092 20.9048 71.2968 29.1514 72.0883 36.1489C73.0508 44.6553 69.7567 46.9294 64.7638 52.97C62.818 55.3246 61.0639 58.3909 58.8221 60.5936C54.1804 65.4937 48.0048 67.6221 41.3997 68.0347C40.4917 68.0914 39.365 68.1605 38.4538 68.0884C37.2528 68.1773 34.8698 67.9618 33.6748 67.7678C33.7106 67.5722 33.7415 67.7517 33.7754 67.4717L33.6551 67.4357L33.7944 67.359C34.9994 67.4932 36.1491 67.6259 37.364 67.6497C42.5195 67.6642 47.4825 67.1611 52.1671 64.8679C56.7152 62.6414 59.7639 59.1195 62.5825 55.0331C63.0381 54.372 63.6056 53.5905 64.1111 52.96C66.7003 49.7342 69.9454 46.733 71.3474 42.7471C72.1028 40.5812 71.7339 38.1691 71.5844 35.9541C71.1081 28.8986 70.5091 20.9606 63.0066 17.8049C61.2564 17.0687 59.3613 16.1791 57.8872 14.9859C56.4115 13.791 55.2005 12.298 53.948 10.8785C50.3533 6.78588 47.129 3.35993 41.794 1.6407C35.0109 -0.544759 30.1077 1.3205 24.6099 5.31515C23.2598 6.16295 21.3627 7.88395 19.8326 8.32219C16.2454 9.34961 12.2741 8.95048 8.88868 10.8519C8.1629 11.2594 7.19661 11.7703 6.60144 12.3857C4.39926 14.6631 3.14121 18.117 2.18956 21.0895C2.05066 20.754 2.15344 20.8972 1.84328 20.664Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M33.7953 67.3582C35.0003 67.4924 36.15 67.6251 37.3649 67.6489C37.5827 67.7724 38.7086 67.7501 39.0376 67.7555C38.4516 67.7962 37.5152 67.7133 37.0166 67.7969C37.4124 67.9358 38.7239 67.9242 39.1971 67.9327L39.2086 67.9672C38.9586 68.014 38.707 68.0546 38.4547 68.0876C37.2536 68.1766 34.8707 67.9611 33.6757 67.767C33.7115 67.5714 33.7423 67.7509 33.7763 67.471L33.656 67.4349L33.7953 67.3582Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M0.831898 39.1565C0.827219 38.6588 0.761566 36.7912 0.940192 36.4315C1.15663 36.3832 1.05217 36.3694 1.25971 36.4415C1.35282 36.7291 1.29714 37.1839 1.28019 37.5022C1.28694 40.1428 1.17519 43.7721 3.05847 45.8682C3.4326 46.2847 4.4051 46.6198 4.78997 46.0768C5.27001 45.3574 5.12436 44.1671 5.00487 43.3595C4.74341 41.5924 3.79652 39.6136 4.86414 37.9294C5.26173 37.302 6.06282 37.1739 6.63367 37.6326C7.43523 38.2761 7.62697 39.405 7.73511 40.3699C7.99956 42.6194 7.78389 48.4245 6.38027 50.0865C6.3012 50.1793 6.21936 50.2691 6.13484 50.3573C6.31538 52.0944 6.7955 53.771 8.24667 54.8816C10.8403 56.8435 14.0945 57.7378 16.8898 59.3829C18.415 60.2802 19.804 61.2957 21.2401 62.3135C24.2894 64.474 27.6679 66.0049 31.2985 66.8861C31.8211 67.0126 33.4007 67.1975 33.7955 67.3578L33.6562 67.4345L33.7765 67.4705C33.7425 67.7505 33.7117 67.571 33.6759 67.7666C29.8915 67.5188 24.2547 65.0799 21.201 62.9224C19.4946 61.6562 17.8478 60.5556 16.0054 59.5002C11.6248 56.9915 6.04771 56.4707 5.62581 50.4232C3.19392 49.2689 4.88599 46.0814 5.9727 47.0072C6.26622 47.6852 6.13729 48.8609 6.14427 49.6731C7.42993 46.9297 7.52726 42.7398 7.1414 39.7241C7.04101 38.9387 6.1896 36.9423 5.27331 38.2032C4.10676 39.8092 5.63884 42.3479 5.63041 44.1242C5.63071 44.8842 5.78587 45.7455 5.23496 46.3322C4.51601 47.0977 3.27054 46.9535 2.61348 46.1988C1.032 44.3842 0.800222 41.4444 0.831898 39.1565Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M0.831898 39.1565C0.827219 38.6588 0.761566 36.7912 0.940192 36.4315C1.15663 36.3832 1.05217 36.3694 1.25971 36.4415C1.35282 36.7291 1.29714 37.1839 1.28019 37.5022C1.15495 37.7139 1.1824 39.1312 1.136 39.553L1.0998 39.346L1.02794 39.5239L1.08354 39.4326L0.919178 39.55C0.874618 39.428 0.856211 39.2869 0.831898 39.1565Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M9.08351 23.4485C10.2272 19.5177 12.5018 14.5784 16.0966 12.3854C17.4519 11.6021 19.0304 11.6636 20.458 11.9759C23.2343 12.5831 24.1711 16.254 21.4371 17.4495C16.9658 19.4047 13.118 22.1004 11.1539 26.8286C10.8807 26.7055 10.9703 26.7551 10.7875 26.4549C12.0287 23.3014 14.4026 20.8806 17.2221 19.0649C17.7987 18.695 18.3931 18.3535 19.003 18.0416C19.782 17.6461 20.5768 17.3321 21.3377 16.8927C23.5122 15.6367 22.6016 13.2767 20.5016 12.5143C19.2317 12.0665 17.8359 12.1412 16.6211 12.7224C12.7462 14.5658 10.8105 20.1018 9.46369 23.8437C9.19541 23.7113 9.2721 23.738 9.08351 23.4485Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M1.84381 20.6635C2.15397 20.8967 2.0512 20.7535 2.1901 21.0891C1.14281 24.2447 0.430296 28.433 0.85297 31.7472C0.944469 32.4647 1.41661 33.3598 1.47912 33.7333C1.50734 34.0063 1.55528 34.0968 1.67148 34.3354L1.59762 34.4044L1.31522 34.2986C1.2034 34.2011 1.08859 34.0155 1.02477 33.889C-0.648204 30.5797 0.747973 24.0673 1.84381 20.6635Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M7.96875 31.7815C8.09024 32.4614 7.85969 33.0366 7.68398 33.6939C8.02229 33.0696 8.10251 32.3494 8.3757 32.0106C7.93639 34.9985 6.15243 37.6261 2.86576 35.6604C2.35672 35.3559 1.60656 34.8175 1.31534 34.2982L1.59774 34.4041L1.6716 34.3351C1.55541 34.0965 1.50747 34.006 1.47924 33.733C2.94545 35.6074 5.69187 37.0562 7.1481 34.2867C7.60905 33.4109 7.756 32.7497 7.96875 31.7815Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M9.08348 23.4485C9.27208 23.738 9.19538 23.7113 9.46367 23.8437C9.08318 25.3375 8.76612 26.6157 8.64555 28.1753C8.55167 29.3892 8.63297 30.839 8.37527 32.0111C8.10207 32.3499 8.02185 33.0701 7.68354 33.6944C7.85926 33.0371 8.08981 32.4619 7.96832 31.7819C8.12294 30.5108 8.10721 29.3113 8.20684 28.0435C8.33086 26.4654 8.68589 24.9726 9.08348 23.4485Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const tossRef = useRef<gsap.core.Timeline | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false); // load hit 100 → pan unlocks
  const openedRef = useRef(false);

  const finish = () => {
    window.dispatchEvent(new Event(LOADER_DONE_EVENT));
    document.body.classList.remove("is-loading");
    ScrollTrigger.refresh();
    setDone(true);
  };

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReduced) {
        finish();
        return;
      }

      document.body.classList.add("is-loading");

      // Entrance — pan settles in, label + counter rise after it.
      gsap.set(".pan__group", { scale: 0.82, opacity: 0, y: 12 });
      gsap.set(".pan__label", { opacity: 0, y: 8 });
      gsap.set(".pan__count", { opacity: 0, y: 14 });
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .to(".pan__group", { scale: 1, opacity: 1, y: 0, duration: 1.0 })
        .to(".pan__label", { opacity: 1, y: 0, duration: 0.6 }, "-=0.5")
        .to(".pan__count", { opacity: 1, y: 0, duration: 0.6 }, "<");

      // The tossing loop, built so the pancake's flight reads as REAL physics
      // driven by the pan — every phase of the pancake is causally tied to what
      // the pan is doing at that instant:
      //
      //   t=0.00  WINDUP  — pan dips back & down, loading the throw. Pancake
      //                     rides with the pan (glued to the bowl).
      //   t=0.24  FLICK   — pan snaps UP fast; at the top of the flick the
      //                     pancake LAUNCHES with the pan's upward velocity.
      //   ~AIR    FLIGHT  — pancake is a projectile: a single symmetric
      //                     parabola (decelerate up, accelerate down under
      //                     "gravity") while it spins one full flip. The pan is
      //                     NOT touching it, so the pan recovers to rest and
      //                     waits underneath.
      //   IMPACT  CATCH   — the instant the pancake returns to bowl level, the
      //                     pan dips to ABSORB it (give with the momentum), then
      //                     springs back — a visible catch, not a hard stop.
      //
      // A real pancake flip is powered by a DIP-DOWN then a fast WHIP-UP: the
      // pan drops to load, then swings back up hard, and the pancake — riding
      // the pan all the way down and back up — gets flung off as the pan whips
      // up THROUGH and past its rest level. So the launch comes from BELOW, on
      // the up-stroke, not from a flick starting at rest.
      //
      // Timing (the pan drives everything; pancake is glued until DIP→launch):
      const DIP_DEPTH = 20; // how far the pan drops on the windup
      const DIP_AT = 0.42; // pan reaches the BOTTOM of the dip here
      const LAUNCH_AT = 0.6; // pan whips back UP through rest → pancake flies
      const WHIP_TOP = -16; // small overshoot above rest as the pan tops its whip
      const AIR = 0.86; // pancake airborne time (a touch longer = smoother flip)
      const APEX = -116; // peak height of the pancake above the bowl
      const IMPACT = LAUNCH_AT + AIR;

      const toss = gsap.timeline({ repeat: -1, repeatDelay: 0.7, delay: 1.05 });

      toss
        // WINDUP / DIP — pan sinks DOWN and tips the bowl DOWN to scoop (the
        // front lip drops, like loading a throw). Pivot is at the handle, so a
        // NEGATIVE rotation drops the bowl end; positive would lift it (which
        // read backwards — as if the pancake was pulling the pan up). Pancake
        // glued in the bowl, riding smoothly down with it.
        .to(".pan__svg", { y: DIP_DEPTH, rotation: -6, duration: DIP_AT, ease: "sine.inOut" }, 0)
        .to(".pan__cake", { y: DIP_DEPTH, duration: DIP_AT, ease: "sine.inOut" }, 0)

        // WHIP-UP — from the bottom the pan swings back up FAST and un-tilts.
        // The pancake stays glued through the up-stroke until the pan reaches
        // rest level (y:0) — that's the launch instant (LAUNCH_AT): the pan's
        // upward speed is highest here, so this is what flings the pancake.
        .to(".pan__svg", { y: 0, rotation: 0, duration: LAUNCH_AT - DIP_AT, ease: "power3.in" }, DIP_AT)
        .to(".pan__cake", { y: 0, duration: LAUNCH_AT - DIP_AT, ease: "power3.in" }, DIP_AT)

        // LAUNCH — pancake leaves the pan at rest level with the pan's upward
        // momentum and arcs freely: rise decelerating, fall accelerating (real
        // gravity), a gentle sideways drift, and ONE smooth flip across the arc.
        .to(".pan__cake", { y: APEX, duration: AIR / 2, ease: "power2.out" }, LAUNCH_AT)
        .to(".pan__cake", { y: 0, duration: AIR / 2, ease: "power2.in" }, LAUNCH_AT + AIR / 2)
        .to(".pan__cake", { x: 10, duration: AIR / 2, ease: "sine.out" }, LAUNCH_AT)
        .to(".pan__cake", { x: 0, duration: AIR / 2, ease: "sine.in" }, LAUNCH_AT + AIR / 2)
        .to(
          ".pan__cake",
          { rotation: 360, duration: AIR, ease: "none" }, // one steady flip
          LAUNCH_AT,
        )

        // pan CONTINUES its whip a touch past rest (natural follow-through of the
        // up-swing that threw the pancake), tops out at WHIP_TOP, then eases back
        // to rest and waits, level, under the airborne pancake.
        .to(".pan__svg", { y: WHIP_TOP, duration: 0.12, ease: "power1.out" }, LAUNCH_AT)
        .to(".pan__svg", { y: 0, duration: 0.34, ease: "sine.inOut" }, LAUNCH_AT + 0.12)

        // CATCH — timed to IMPACT: the pan gives downward to absorb the pancake's
        // momentum, then springs back with a soft elastic settle. The pancake
        // lands with it — no hard mechanical stop.
        .to(".pan__svg", { y: 9, rotation: -2, duration: 0.11, ease: "power2.out" }, IMPACT)
        .to(".pan__cake", { y: 9, duration: 0.11, ease: "power2.out" }, IMPACT)
        .to(".pan__svg", { y: 0, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }, IMPACT + 0.11)
        .to(".pan__cake", { y: 0, duration: 0.5, ease: "elastic.out(1, 0.55)" }, IMPACT + 0.11)
        // reset drift for the next cycle (rotation already landed at 360 = flat).
        .set(".pan__cake", { rotation: 0, x: 0 });
      tossRef.current = toss;

      // Counter reflects REAL loading: eases to 90 over ~1.7s, holds until the
      // hero has buffered (whenHeroVideoReady), then 90→100 and unlocks.
      const counter = { value: 0 };
      const paint = () => {
        if (countRef.current) {
          countRef.current.textContent = String(Math.round(counter.value));
        }
      };

      gsap.to(counter, {
        value: 90,
        duration: 1.7,
        ease: "power2.out",
        delay: 0.35,
        onUpdate: paint,
        onComplete: () => {
          whenHeroVideoReady().then(() => {
            gsap.to(counter, {
              value: 100,
              duration: 0.4,
              ease: "power2.inOut",
              onUpdate: paint,
              onComplete: () => {
                // dish served — counter bows out, prompt swaps in
                gsap.to(".pan__count", {
                  opacity: 0,
                  y: 10,
                  duration: 0.45,
                  ease: "power2.in",
                });
                setReady(true);
              },
            });
          });
        },
      });
    },
    { scope: root },
  );

  const openPan = () => {
    if (!ready || openedRef.current) return;
    openedRef.current = true;

    // Hand off to the hero partway through — while the hole is opening — so
    // the headline rises as the scene is being unveiled.
    let handedOff = false;
    const handOff = () => {
      if (handedOff) return;
      handedOff = true;
      window.dispatchEvent(new Event(LOADER_DONE_EVENT));
      document.body.classList.remove("is-loading");
      ScrollTrigger.refresh();
    };

    // Take over from the loop wherever it is — snap pan & pancake back to rest
    // (level, y:0) so the final throw starts from a clean, known state instead
    // of mid-arc.
    tossRef.current?.pause();
    gsap.to([".pan__svg", ".pan__cake"], {
      y: 0,
      x: 0,
      rotation: 0,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });

    const tl = gsap.timeline({
      delay: 0.18, // let the settle above finish first
      onComplete: () => {
        handOff();
        setDone(true);
      },
    });

    // Same causal chain as the loop, but the throw is HARDER and the pancake
    // never returns — it clears the top of the screen. WINDUP → FLICK launches
    // the pancake at the flick's peak → it flies off decelerating under gravity.
    // Same dip-down → whip-up mechanic as the loop, but HARDER — the pancake
    // sails clean off the top of the screen and never returns.
    const OUT_DIP = 0.24; // pan reaches the bottom of the dip
    const OUT_LAUNCH = 0.4; // pan whips up through rest → pancake flies off
    const OUT_REVEAL = OUT_LAUNCH + 0.15; // hole opens just after launch
    tl
      .to(".pan__label", { opacity: 0, duration: 0.25 }, 0)
      // dip — pan (and pancake) sink down to load, tilting back to scoop.
      .to(".pan__svg", { y: 20, rotation: 8, duration: OUT_DIP, ease: "sine.inOut" }, 0)
      .to(".pan__cake", { y: 20, duration: OUT_DIP, ease: "sine.inOut" }, 0)
      // whip-up — pan swings up fast; pancake glued until it passes rest level.
      .to(".pan__svg", { y: 0, rotation: 0, duration: OUT_LAUNCH - OUT_DIP, ease: "power3.in" }, OUT_DIP)
      .to(".pan__cake", { y: 0, duration: OUT_LAUNCH - OUT_DIP, ease: "power3.in" }, OUT_DIP)
      // launch — pancake flies off-screen decelerating (gravity), many flips.
      .to(
        ".pan__cake",
        { y: "-85vh", rotation: 1000, duration: 1.0, ease: "power1.out" },
        OUT_LAUNCH,
      )
      // pan follows through a touch past rest, then eases back down, now empty.
      .to(".pan__svg", { y: -16, duration: 0.12, ease: "power1.out" }, OUT_LAUNCH)
      .to(".pan__svg", { y: 0, duration: 0.4, ease: "sine.inOut" }, OUT_LAUNCH + 0.12)
      // 2. the reveal — a circular hole opens from the pan's spot and expands
      //    until the hero fills the screen. The overlay (pan included) is
      //    eaten by the mask as it grows: the site emerges from behind the pan.
      //    NO white — the hero is revealed directly.
      .add(handOff, OUT_REVEAL)
      .fromTo(
        root.current,
        { "--hole": 0 },
        { "--hole": 165, duration: 1.15, ease: "power2.inOut" },
        OUT_REVEAL,
      );
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPan();
    }
  };

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] overflow-hidden bg-black"
      role="dialog"
      aria-label="Site intro"
      aria-modal="true"
      style={
        {
          // the exit reveal: a transparent circle punched through the black,
          // radius driven by --hole (in vmax) from the pan's position.
          "--hole": 0,
          maskImage:
            "radial-gradient(circle calc(var(--hole) * 1vmax) at 50% 46%, transparent 99%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle calc(var(--hole) * 1vmax) at 50% 46%, transparent 99%, black 100%)",
        } as React.CSSProperties
      }
    >
      {/* centered pan group */}
      <button
        type="button"
        onClick={openPan}
        onKeyDown={onKey}
        disabled={!ready}
        aria-label={ready ? "Click to enter the site" : "Loading"}
        className={`pan__group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center bg-transparent ${
          ready ? "cursor-pointer" : "cursor-progress"
        }`}
      >
        {/* the pan + its pancake (Figma 124:82). Nudged RIGHT: the handle
            trails off to the right so the bowl (the visual mass) sits left of
            the geometric centre — this offset re-centres it VISUALLY. */}
        <span className="relative block w-[clamp(200px,22vw,300px)] translate-x-[13%]">
          <PanArt />
          {/* fried egg (Figma Group 11) — the food the pan tosses, resting DOWN
              IN the bowl so it reads as inside the pan. Keeps the `pan__cake`
              class + will-change so all the toss/flip/exit GSAP physics drive it
              unchanged (it just replaces the old pancake ellipse). Its own black
              backing ellipse occludes the pan's rim/floor lines behind it. */}
          <span
            className="pan__cake absolute block will-change-transform"
            aria-hidden="true"
            style={{ left: "20%", top: "17%", width: "40%" }}
          >
            {/* Isometric lay-in — the egg lies FLAT into the pan floor, spread
                WIDE + DOWN to fill the elliptical bowl (top edge anchored/receding,
                sides + bottom pulled out). Center transformOrigin keeps it seated
                in the bowl; scaleX widens, scaleY flattens (Figma "Fast Isometric"
                skew, skewX -71°/skewY 22°, reproduced as CSS skew+scale; raw -71°
                collapses). On this INNER wrapper so .pan__cake stays free for the
                GSAP toss. */}
            <span
              className="block"
              style={{ transform: "skewX(-58deg) skewY(21deg) scaleX(1.24) scaleY(0.4)" }}
            >
              <EggArt />
            </span>
          </span>
        </span>

        {/* label beneath the pan — EB Garamond Medium Italic (Figma 124:89).
            Nudged with the pan so it sits under the bowl, not the whole box. */}
        <span className="pan__label mt-6 translate-x-[13%] text-[clamp(24px,2.6vw,40px)] italic leading-none text-white [font-family:var(--font-eb-garamond)]">
          {ready ? "click to enter" : "cooking"}
        </span>
      </button>

      {/* loading counter — huge, bold, bottom-left (Figma 124:87) */}
      <span
        className="pan__count absolute bottom-[clamp(12px,3vh,40px)] left-[clamp(20px,4vw,64px)] text-[clamp(56px,7.5vw,96px)] font-bold leading-none text-white tabular-nums"
        aria-hidden="true"
      >
        <span ref={countRef}>0</span>
      </span>
    </div>
  );
}
