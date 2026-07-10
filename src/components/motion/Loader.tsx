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

/** Line-art fried egg PRE-DISTORTED into the pan's perspective (viewBox 116 × 64,
 *  from the user's Figma export). The isometric lay-in is baked into the PATHS,
 *  so it needs NO CSS skew/scale — used at natural proportions. Yolk #FBC94A /
 *  #FDDC81, white line-art. The black backing ellipse occludes the pan's rim/
 *  floor lines behind the egg so it reads as sitting inside the bowl. */
function EggArt() {
  return (
    <svg
      className="block w-full overflow-visible"
      viewBox="0 0 116 64"
      fill="none"
      aria-hidden="true"
    >
      {/* occluder — sits behind the egg, hides the pan lines under it. Sized to
          the pre-distorted egg body (roughly x14–100, y13–48; center ~57,31). */}
      <ellipse cx="55" cy="31" rx="28" ry="14" fill="black" />
      <path
        d="M55.4448 23.078C62.8137 23.4476 69.8806 25.4537 73.1423 27.995C75.3386 29.7719 75.207 31.683 73.5017 33.4266C71.4047 35.5706 67.2872 37.2874 61.6259 38.1597C57.355 38.8182 52.5767 38.7382 48.1551 38.0436C42.2886 37.1224 36.9542 35.0388 34.3276 32.8737C32.1004 31.0383 30.9526 28.8504 32.8328 26.9921C33.1174 26.7109 33.462 26.4497 33.921 26.2053C35.4257 25.4044 42.0941 22.7376 41.0484 21.7331C40.6809 21.3801 38.536 21.3769 38.8488 20.9535C39.2363 20.4295 42.3723 19.7752 43.6429 19.5586C43.8137 19.529 43.9874 19.5015 44.1637 19.4762C44.0494 19.6424 44.0132 19.5927 44.1501 19.7351C41.9461 20.1217 40.9369 20.3823 39.2713 21.0443C40.0426 21.1659 41.1759 21.3038 41.5367 21.6116C42.3764 22.3282 40.5904 23.3021 39.6259 23.8431C38.5506 24.4333 37.4055 25.0044 36.1937 25.5552C35.364 25.9368 34.185 26.4227 33.6763 26.8781C31.7961 28.5612 32.5948 30.8033 34.5694 32.5053C34.7791 32.6882 35.0101 32.8678 35.2609 33.0441C35.3668 32.9967 35.4652 32.9507 35.3923 32.8773C34.6671 32.1404 33.3804 29.9849 34.7672 29.3914C35.2764 28.1628 35.8143 27.1434 37.7235 26.1184C39.1748 25.246 42.0105 24.3995 44.3233 23.8687C45.2699 23.414 46.6924 22.8995 48.4192 23.2268C50.5477 23.0386 53.2547 22.9328 55.4448 23.078Z"
        fill="#FBC94A"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M68.1903 33.1802C67.269 32.9322 66.8124 33.6716 66.1706 33.9501C64.8498 34.5241 63.3455 35.0267 61.2721 35.193C59.4703 35.3376 58.0699 34.9987 57.8336 34.2823C57.4803 32.733 58.5319 30.2881 59.8479 28.8976C60.1926 28.5337 60.6705 28.1919 61.2685 27.8817C62.5643 27.2083 64.6646 26.5744 66.9025 27.2778C69.3534 28.0482 70.0495 28.9607 70.4947 30.0691C70.6464 31.4633 70.5795 32.2393 68.5224 33.4202C68.4858 33.2971 68.4935 33.3014 68.3586 33.1871L68.1903 33.1802Z"
        fill="#FDDC81"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M73.1417 27.9949C75.338 29.7717 75.2063 31.6828 73.5011 33.4264C71.404 35.5704 67.2866 37.2873 61.6253 38.1595C57.3544 38.818 52.5761 38.738 48.1545 38.0435C42.288 37.1222 36.9536 35.0386 34.327 32.8736C32.0998 31.0381 30.952 28.8503 32.8322 26.992C33.1167 26.7108 33.4613 26.4495 33.9204 26.2052C35.4251 25.4043 42.0935 22.7374 41.0478 21.7329C40.6803 21.3799 38.5354 21.3767 38.8482 20.9533C39.2356 20.4294 42.3717 19.7751 43.6423 19.5585C43.8131 19.5289 43.9868 19.5014 44.1631 19.4761C44.0487 19.6423 44.0126 19.5925 44.1495 19.735C41.9455 20.1215 40.9363 20.3822 39.2707 21.0441C40.042 21.1658 41.1753 21.3037 41.536 21.6115C42.3758 22.328 40.5898 23.3019 39.6253 23.843C38.55 24.4331 37.4049 25.0043 36.1931 25.555C35.3633 25.9367 34.1844 26.4225 33.6756 26.878C31.7955 28.561 32.5941 30.8032 34.5688 32.5051C34.7784 32.688 35.0095 32.8677 35.2603 33.0439C35.5944 33.378 36.3593 33.8309 36.9087 34.1272C39.6197 35.5905 43.2384 36.9158 47.5244 37.6836C51.7925 38.4453 56.5923 38.5578 60.8685 37.9959C66.0912 37.2987 70.2296 35.7162 72.3543 33.8181C74.5432 31.8627 74.7621 30.0413 72.5383 27.985C72.7895 28.0193 72.8626 28.0031 73.1417 27.9949Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M63.7383 35.0764C54.8152 36.7391 57.1264 32.3486 58.0467 30.6576C58.7314 29.4001 59.1133 28.4484 61.4228 27.4525C66.0198 25.47 70.7926 28.1894 71.0698 29.9709C70.7284 30.2982 71.2418 30.9537 70.8337 31.4742L70.857 31.4369C70.5737 31.1279 71.0458 30.3453 70.4972 30.0686C70.0519 28.9601 69.3559 28.0477 66.905 27.2773C64.6671 26.5739 62.5668 27.2078 61.271 27.8811C60.673 28.1913 60.195 28.5331 59.8503 28.8971C58.5344 30.2876 57.4828 32.7324 57.8361 34.2818C58.0724 34.9981 59.4728 35.3371 61.2746 35.1924C63.3479 35.0261 64.8523 34.5236 66.1731 33.9496C66.8149 33.6711 67.2715 32.9317 68.1928 33.1796L68.3611 33.1866C68.496 33.3009 68.4883 33.2966 68.5249 33.4197L68.543 33.4353C67.0734 34.2026 66.1812 34.6833 64.286 35.3454C64.0636 35.388 64.0299 35.3852 63.7765 35.4017C63.923 35.2938 64.0493 35.2465 64.0876 35.1291L63.7383 35.0764Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M68.542 33.4352C68.8963 33.3648 68.8766 33.3881 69.2441 33.442C66.7547 34.9154 61.4789 37.0114 56.7391 37.3274C49.5402 37.8068 36.9962 34.5008 35.6031 31.7688C35.6409 31.5698 35.527 31.4467 35.4849 31.2403C36.0239 31.4423 35.5415 31.4666 36.0885 31.6355C37.1268 32.8132 38.339 33.5764 40.7895 34.4895C44.3783 35.8265 50.0416 37.07 55.0591 37.1571C58.4344 37.2156 62.0928 36.1821 64.285 35.3453C66.1801 34.6832 67.0723 34.2025 68.542 33.4352Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M55.4444 23.0776C55.4788 23.1341 55.5493 23.2352 55.567 23.2882C50.2103 23.0971 45.006 23.7248 41.1431 25.0278C39.8184 25.4673 38.9848 25.8712 37.9784 26.4013C37.3736 26.5417 37.4557 26.7269 36.9544 26.8239C37.1714 26.5843 37.7207 26.3438 37.7231 26.118C39.1743 25.2456 42.0101 24.3991 44.3229 23.8682C45.2695 23.4136 46.692 22.899 48.4188 23.2264C50.5473 23.0381 53.2543 22.9323 55.4444 23.0776Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M55.4438 23.0775C62.8127 23.447 69.8796 25.4532 73.1413 27.9945C72.8622 28.0028 72.7892 28.0189 72.5379 27.9846C72.1424 27.6823 71.9164 27.5174 71.4276 27.2366C70.6743 26.7531 69.5577 26.2847 68.5241 25.8817C67.4299 25.4433 64.8249 24.6209 63.3997 24.3688C61.5578 23.9652 59.1545 23.5435 57.071 23.3984C56.476 23.3417 56.1653 23.3205 55.5664 23.2881C55.5487 23.2351 55.4782 23.134 55.4438 23.0775Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M37.7234 26.1182C37.721 26.344 37.1718 26.5845 36.9547 26.824C37.4561 26.727 37.3739 26.5419 37.9787 26.4015C36.1003 27.702 35.0777 29.1932 35.6512 30.7404C35.7044 30.8845 36.1058 31.5444 36.0879 31.6359C35.5409 31.467 36.0234 31.4427 35.4843 31.2406C35.5264 31.447 35.6404 31.5701 35.6025 31.7692C34.8053 30.9679 34.8429 30.2038 34.7671 29.3911C35.2763 28.1625 35.8142 27.1431 37.7234 26.1182Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M71.069 29.9707C71.5626 31.2525 71.1483 32.3972 69.2443 33.4418C68.8769 33.388 68.8966 33.3647 68.5423 33.4351L68.5241 33.4195C70.5812 32.2386 70.6481 31.4626 70.4964 30.0684C71.0451 30.3451 70.5729 31.1276 70.8562 31.4367L70.8329 31.474C71.241 30.9535 70.7276 30.298 71.069 29.9707Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M41.3462 14.2399C44.1312 13.6869 49.9093 12.988 53.0391 13.0481C58.683 13.1564 63.9699 14.9348 68.1109 16.2803C70.2798 16.985 74.1692 17.2812 76.8187 17.4874C85.2369 18.1591 91.9421 19.4606 96.3008 22.4407C100.205 25.11 100.356 27.8034 99.6044 30.6453C98.8178 32.758 99.384 34.2303 101.498 36.2963C105.712 40.4156 97.7174 43.0208 91.835 45.5955C84.6845 48.7255 79.4801 48.2318 69.1392 48.3281C65.1088 48.3658 60.5832 48.707 56.4219 48.5843C47.4851 48.4408 39.7468 46.8203 33.2325 44.4804C32.3369 44.1587 31.227 43.7591 30.4503 43.3943C29.2526 42.9733 27.247 42.0105 26.3224 41.4996C26.5406 41.4494 26.3995 41.5194 26.6957 41.441L26.6182 41.3841L26.8198 41.4114C27.8102 41.9065 28.7507 42.3803 29.8547 42.8432C34.621 44.7792 39.6984 46.4746 46.2101 47.4829C52.5322 48.4618 58.689 48.4572 65.1661 48.1827C66.2136 48.1381 67.4787 48.0963 68.5435 48.0803C73.9943 48.0001 79.8406 48.2386 84.9093 47.4661C87.6577 47.044 89.5963 46.1205 91.552 45.3433C97.7815 42.8678 104.732 40.0591 100.759 36.2212C99.8326 35.3259 98.9166 34.3263 98.6779 33.3857C98.4396 32.4439 98.7284 31.5041 98.9093 30.5728C99.446 27.8937 99.6957 25.5705 96.3748 23.0123C92.1521 19.7598 85.8422 18.5302 76.9677 17.7713C74.9143 17.5416 71.5282 17.3912 69.695 16.9607C65.3976 15.9514 62.0929 14.3338 57.1562 13.6846C56.0979 13.5454 54.7189 13.3497 53.5852 13.3271C49.3901 13.2436 44.9579 13.8968 41.265 14.5081C41.4535 14.3468 41.4134 14.432 41.3462 14.2399Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M26.8213 41.4116C27.8117 41.9067 28.7523 42.3805 29.8562 42.8434C29.9414 42.9652 31.0063 43.3797 31.3063 43.5047C30.7246 43.2984 29.9346 42.9207 29.3934 42.7611C29.629 42.9546 30.8559 43.4421 31.2867 43.6222L31.2648 43.6377C30.9887 43.5593 30.717 43.4783 30.4519 43.3945C29.2541 42.9735 27.2485 42.0107 26.324 41.4998C26.5421 41.4496 26.401 41.5196 26.6972 41.4412L26.6197 41.3843L26.8213 41.4116Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M22.9235 19.8817C23.3898 19.7179 25.0947 19.0853 25.6004 19.0351C25.8468 19.1004 25.763 19.0568 25.8873 19.158C25.7017 19.2865 25.22 19.4137 24.9033 19.511C22.4128 20.3733 18.8776 21.513 18.6419 22.9009C18.595 23.1766 19.1798 23.6501 20.05 23.6174C21.1753 23.563 22.1658 23.121 22.8186 22.8133C24.247 22.14 25.24 21.1411 27.8224 20.9927C28.7842 20.9374 29.6481 21.1958 29.7437 21.5589C29.8785 22.0687 28.9888 22.5081 28.1768 22.8627C26.295 23.6941 20.6062 25.5033 17.7333 25.5186C17.5722 25.5192 17.4115 25.5178 17.2498 25.5148C15.7746 26.148 14.6345 26.8737 14.93 27.7789C15.4798 29.3892 17.6515 30.8994 18.6877 32.4822C19.2534 33.3456 19.5811 34.1966 19.9503 35.0659C20.7348 36.9116 22.4198 38.6756 24.9528 40.3226C25.3176 40.5595 26.6075 41.2114 26.8219 41.4115L26.6203 41.3843L26.6978 41.4411C26.4016 41.5195 26.5427 41.4495 26.3246 41.4998C23.0499 40.0015 20.1297 37.0959 19.3383 35.2495C18.9534 34.198 18.4672 33.2228 17.7567 32.189C16.0671 29.7313 11.3886 27.4725 16.7154 25.3456C15.552 24.0588 20.1347 23.6549 20.267 24.3634C19.8981 24.6941 18.6669 25.0286 17.9054 25.2956C21.6914 24.8841 25.7433 23.5564 28.2369 22.43C28.8864 22.1367 29.9846 21.1678 27.9429 21.2351C25.3427 21.321 24.3629 22.7214 22.6756 23.2965C21.9572 23.5441 21.2867 23.8826 20.2211 23.8673C18.8308 23.8472 17.8124 23.3337 17.9167 22.8418C18.1662 21.6586 20.7309 20.6147 22.9235 19.8817Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M22.9235 19.8817C23.3898 19.7179 25.0947 19.0853 25.6004 19.0351C25.8468 19.1004 25.763 19.0568 25.8873 19.158C25.7017 19.2865 25.22 19.4137 24.9033 19.511C24.587 19.533 23.2724 20.0048 22.8305 20.1247L22.9927 20.0437L22.7579 20.0747L22.8957 20.0658L22.6324 20.0425C22.7064 19.9861 22.8227 19.9332 22.9235 19.8817Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M45.4265 17.8584C50.2035 17.0071 56.9827 16.2511 62.3893 16.8838C64.3866 17.1365 65.7919 17.7478 66.8203 18.3843C68.8203 19.622 66.218 21.1681 62.5526 20.5331C56.5583 19.4947 50.4419 18.9309 44.1502 19.7345C44.0133 19.5921 44.0494 19.6418 44.1638 19.4756C48.2963 18.9138 52.7863 19.015 57.1172 19.4801C58.0016 19.5756 58.8756 19.6871 59.736 19.814C60.8322 19.9771 61.8661 20.1726 62.9871 20.3146C66.1907 20.7203 67.5779 19.6107 66.3517 18.5759C65.5976 17.9544 64.2328 17.4558 62.5569 17.19C57.2212 16.3386 50.1921 17.4158 45.4053 18.1295C45.2817 17.9859 45.3276 18.0233 45.4265 17.8584Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M41.3472 14.2396C41.4143 14.4317 41.4544 14.3466 41.2659 14.5079C37.3112 15.1429 32.6904 16.2396 29.9487 17.4769C29.3551 17.7448 28.9465 18.2131 28.6513 18.3581C28.4193 18.4576 28.3782 18.505 28.2604 18.6262L28.1267 18.621L27.9649 18.4807C27.9533 18.4071 28.0224 18.3037 28.0829 18.2386C29.6607 16.5345 37.1128 14.9373 41.3472 14.2396Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M36.5139 20.1545C35.9837 20.4214 35.226 20.5223 34.4416 20.6705C35.3456 20.5939 36.1009 20.3895 36.6745 20.3816C33.4421 21.1898 29.3036 21.3769 28.1149 19.5058C27.9308 19.2159 27.7444 18.7596 27.9653 18.4815L28.1271 18.6217L28.2608 18.6269C28.3786 18.5058 28.4197 18.4583 28.6517 18.3589C28.2388 19.5184 29.4154 21.0189 33.3842 20.6627C34.6398 20.5503 35.4011 20.3901 36.5139 20.1545Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
      <path
        d="M45.4264 17.8584C45.3275 18.0233 45.2817 17.9859 45.4052 18.1295C43.64 18.4733 42.1375 18.7707 40.5511 19.2333C39.3162 19.5933 38.0209 20.0957 36.6737 20.3808C36.1001 20.3888 35.3447 20.5932 34.4408 20.6697C35.2252 20.5215 35.9828 20.4206 36.513 20.1538C37.8583 19.7978 38.9778 19.4014 40.2689 19.026C41.876 18.5587 43.6167 18.2057 45.4264 17.8584Z"
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
          {/* fried egg — the perspective is BAKED INTO the vector (pre-distorted
              116×64 export), so NO CSS skew/scale: it's used at natural proportions
              and just seated in the bowl via left/top/width. .pan__cake carries the
              GSAP toss transforms. */}
          <span
            className="pan__cake absolute block will-change-transform"
            aria-hidden="true"
            style={{ left: "26%", top: "44%", width: "36%" }}
          >
            <EggArt />
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
