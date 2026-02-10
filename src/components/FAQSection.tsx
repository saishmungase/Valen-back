import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Can I Use PixeMatch for Free?",
    a: "PixeMatch lets you access a variety of fun features for free, but customizing who you meet by gender and region filter is available through our Gems on our website.",
  },
  {
    q: "What Makes PixeMatch Stand Out?",
    a: "PixeMatch makes meeting new people feel real and exciting with face-to-face video chats that happen in the moment. It's not just messages or profiles — it's real conversations, in real time.",
  },
  {
    q: "Is PixeMatch a random video chat?",
    a: "PixeMatch isn't purely random — the more you use it, the more our recommendation algorithm learns the type of people you enjoy chatting with and seeks to find similar matches.",
  },
  {
    q: "What kind of safety tools does PixeMatch offer?",
    a: "If something feels off during a chat, our MatchBlur feature automatically blurs the other person's screen. You can report anyone with just a tap — we capture the key video and audio so you don't have to explain everything.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24 px-6" id="about">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-heading font-bold text-foreground mb-8 text-center">
          FAQs
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="card-surface rounded-xl border-border px-6"
            >
              <AccordionTrigger className="text-left font-heading font-semibold text-foreground hover:text-primary transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
