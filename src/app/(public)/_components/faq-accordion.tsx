'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface FaqEntry {
  id: string
  question: string
  answer: string
  category?: string
}

/** Premium, accessible accordion for the public FAQ section (Radix-backed). */
export function FaqAccordion({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {faqs.map((f) => (
        <AccordionItem
          key={f.id}
          value={f.id}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card px-5 transition-colors last:border-b data-[state=open]:border-emerald-500/40 data-[state=open]:bg-emerald-50/40 dark:data-[state=open]:bg-emerald-950/20"
        >
          <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline [&[data-state=open]>svg]:text-emerald-600">
            {f.question}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
            {f.answer.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-3' : undefined}>{line}</p>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
