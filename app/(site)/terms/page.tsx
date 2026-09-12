import { Fragment } from "react";
import { Container } from "@/components/ui/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TP Tour Terms",
  description: "TP Tour Society Rules — the terms members agree to by joining and participating in TP Tour events.",
};

type Block = { p: string } | { list: string[] };

interface Section {
  number: number;
  title: string;
  blocks: Block[];
}

const sections: Section[] = [
  {
    number: 1,
    title: "Respect the Network",
    blocks: [
      { p: "TP Tour is a professional community as much as it is a golf society." },
      { p: "Members are encouraged to introduce themselves, engage with other members, build relationships and make the most of the network." },
      { p: "We want conversations and connections to happen naturally, both on and off the course." },
      { p: "Please treat fellow members, guests, TP Tour organisers, golf club staff and event partners with respect at all times." },
    ],
  },
  {
    number: 2,
    title: "Member Information & Privacy",
    blocks: [
      { p: "Information made available through the TP Tour member network is for **TP Tour purposes only**." },
      { p: "Member contact details, employment information, profile information or any other personal information must not be copied, exported, shared, sold or used outside of the TP Tour community unless the individual member has expressly consented to this." },
      { p: "Membership of TP Tour does not constitute permission to add members to mailing lists, marketing databases or third-party platforms." },
      { p: "Please respect the network." },
    ],
  },
  {
    number: 3,
    title: "Networking, Not Spamming",
    blocks: [
      { p: "Members are actively encouraged to connect and do business with one another." },
      { p: "However, TP Tour should not be used for unsolicited mass marketing, excessive sales messages, automated outreach or repeated unwanted approaches to other members." },
      { p: "**Build relationships first. Business will follow.**" },
    ],
  },
  {
    number: 4,
    title: "Event Places",
    blocks: [
      { p: "Unless otherwise stated, places at TP Tour events are allocated on a **first come, first served basis**." },
      { p: "An event entry is only considered confirmed once all required registration steps have been completed." },
      { p: "When an event reaches capacity, additional members may be added to a waiting list." },
      { p: "TP Tour reserves the right to amend event capacity where required by the host venue." },
    ],
  },
  {
    number: 5,
    title: "Event Payments",
    blocks: [
      { p: "Where payment is required in advance, the payment deadline shown for the event must be followed to secure your place." },
      { p: "If a member participates in an event with an outstanding balance, the full amount must be paid within **48 hours of the event finishing**." },
      { p: "If payment remains outstanding after 48 hours, the member's TP Tour account may be suspended." },
      { p: "While suspended, the member will be unable to enter or participate in future TP Tour events until the outstanding balance has been paid in full." },
      { p: "Repeated late or non-payment may result in membership being reviewed or withdrawn." },
    ],
  },
  {
    number: 6,
    title: "Cancellations & No-Shows",
    blocks: [
      { p: "If you can no longer attend an event, please withdraw or notify TP Tour as early as possible so your place can be offered to another member." },
      { p: "Cancellation and refund deadlines may vary depending on the venue and will be displayed on the individual event page." },
      { p: "Where TP Tour has already committed to or paid the golf club for a member's place, the member may remain liable for the event fee." },
      { p: "Repeated late cancellations or no-shows may result in restrictions on future event entries." },
    ],
  },
  {
    number: 7,
    title: "Handicaps",
    blocks: [
      { p: "Members are responsible for providing an accurate and current handicap when entering TP Tour competitions." },
      { p: "Members must notify TP Tour of any material change to their handicap." },
      { p: "TP Tour reserves the right to review or adjust the handicap used for society competitions where necessary to maintain fair competition." },
      { p: "Deliberately providing an inaccurate handicap may result in disqualification, adjustment of results or suspension from competitive events." },
    ],
  },
  {
    number: 8,
    title: "Competition Rules",
    blocks: [
      { p: "Unless specifically stated otherwise for an event, golf will be played in accordance with the **Rules of Golf**, together with any Local Rules issued by the host venue and TP Tour competition rules." },
      { p: "The format, handicap allowance, scoring method and any event-specific rules will be published before each competition." },
      { p: "The decision of the TP Tour event organisers on competition matters is final." },
    ],
  },
  {
    number: 9,
    title: "Scorecards & Scores",
    blocks: [
      { p: "Players are responsible for ensuring their scores are accurate before submission." },
      { p: "Once results have been published, any scoring error should be raised with TP Tour as soon as possible." },
      { p: "TP Tour reserves the right to correct genuine scoring or administrative errors and update event results and Order of Merit standings accordingly." },
      { p: "Knowingly submitting an incorrect score is considered a serious breach of the spirit of TP Tour competition." },
    ],
  },
  {
    number: 10,
    title: "Order of Merit",
    blocks: [
      { p: "Eligible TP Tour events contribute towards the season-long Order of Merit." },
      { p: "The points structure, qualifying events and number of counting results will be published by TP Tour." },
      { p: "Where results are subsequently amended, the Order of Merit will automatically be recalculated." },
      { p: "TP Tour reserves the right to make reasonable corrections where an administrative or scoring error has affected the standings." },
    ],
  },
  {
    number: 11,
    title: "Pace of Play",
    blocks: [
      { p: "Keep up with the group in front, not simply ahead of the group behind." },
      { p: "Members are expected to respect the pace-of-play requirements of the host golf club and TP Tour." },
      { p: "Play ready golf where appropriate and help make the day enjoyable for everyone on the course." },
    ],
  },
  {
    number: 12,
    title: "Golf Club Etiquette",
    blocks: [
      { p: "Members must comply with the rules, dress code and policies of each host venue." },
      { p: "Please respect:" },
      { list: ["The golf course", "Clubhouse facilities", "Golf club employees", "Other golfers", "TP Tour representatives", "Fellow members and guests"] },
      { p: "Any damage, misconduct or serious breach of a venue's rules may result in the member being personally responsible for associated costs and may affect their TP Tour membership." },
    ],
  },
  {
    number: 13,
    title: "Conduct",
    blocks: [
      { p: "Competitive golf is encouraged. Poor behaviour isn't." },
      { p: "Abusive, discriminatory, threatening, aggressive or seriously inappropriate behaviour towards another member, guest, organiser or venue employee will not be tolerated." },
      { p: "TP Tour reserves the right to suspend or remove a member where their conduct is considered damaging to the society, its members, its partners or its reputation." },
    ],
  },
  {
    number: 14,
    title: "Guests",
    blocks: [
      { p: "Where an event allows guests, the member introducing the guest is responsible for ensuring that they understand and respect TP Tour's event rules." },
      { p: "Guest places are subject to availability and may be priced differently from member places." },
    ],
  },
  {
    number: 15,
    title: "Photography & Content",
    blocks: [
      { p: "Photography and video may be taken at TP Tour events for use across the TP Tour website, social media and promotional material." },
      { p: "Members who do not wish to appear in promotional content should notify TP Tour." },
      { p: "Please also respect another member's wishes if they ask not to be photographed or tagged." },
    ],
  },
  {
    number: 16,
    title: "Commercial Use of TP Tour",
    blocks: [
      { p: "The TP Tour name, logo, member network, event photography and other TP Tour assets must not be used for commercial or promotional purposes without permission." },
      { p: "Businesses interested in promoting themselves to the TP Tour community should speak to us about official partnership or sponsorship opportunities." },
    ],
  },
  {
    number: 17,
    title: "Event Changes",
    blocks: [
      { p: "Golf is occasionally at the mercy of weather, course conditions and venue requirements." },
      { p: "TP Tour reserves the right to change event dates, venues, tee times, formats or other arrangements where reasonably necessary." },
      { p: "Where an event is cancelled or materially changed, members will be informed as soon as reasonably possible." },
    ],
  },
  {
    number: 18,
    title: "Spirit of TP Tour",
    blocks: [
      { p: "Above everything else:" },
      { p: "**Play the game properly. Respect the people around you. Make new connections. Have a good time.**" },
      { p: "TP Tour should be competitive without taking itself too seriously." },
      { p: "We're here to play great golf, meet good people and build the best golf network in the UAE's Finance & Crypto community." },
      { p: "**Golf. Network. Compete.**" },
    ],
  },
];

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-tp-offwhite">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function TermsPage() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
          TP Tour Society Rules
        </h1>

        <div className="mt-8 space-y-4 text-lg leading-relaxed text-tp-offwhite/70">
          <p>
            TP Tour is built around three things: <strong className="text-tp-offwhite">Golf. Network. Compete.</strong>
          </p>
          <p>Our rules are designed to keep events enjoyable, competitive and valuable for everyone involved.</p>
          <p>By joining TP Tour and participating in our events, members agree to follow the rules below.</p>
        </div>

        <div className="mt-16 space-y-14">
          {sections.map((section) => (
            <div key={section.number} id={`section-${section.number}`}>
              <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">
                {section.number}. {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-tp-offwhite/70">
                {section.blocks.map((block, i) =>
                  "list" in block ? (
                    <ul key={i} className="list-disc space-y-1.5 pl-5">
                      {block.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="leading-relaxed">
                      {renderInline(block.p)}
                    </p>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
