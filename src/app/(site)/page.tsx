import { Hero } from "@/components/site/home/Hero";
import { Modes } from "@/components/site/home/Modes";
import { BoardBand, Carriers, Faq, FinalCta, Journey, RaceBand, Stats, Steps } from "@/components/site/home/Rest";
import { Statement } from "@/components/site/home/Statement";
import { WhatItDoes } from "@/components/site/home/WhatItDoes";

export default function Site() {
  return (
    <>
      <Hero />
      <Statement />
      <WhatItDoes />
      <Modes />
      <RaceBand />
      <Steps />
      <BoardBand />
      <Stats />
      <Carriers />
      <Journey />
      <Faq />
      <FinalCta />
    </>
  );
}
