export function FAQ() {
  const faqs = [
    {
      question: "What is Gaia Profile Design?",
      answer: "A collection of readily made, customizable presets designed to help you create stunning, professional profiles with minimal effort.",
      span: "lg:col-span-2"
    },
    {
      question: "How do I customize the presets?",
      answer: "Each preset comes with a corresponding .toml and .css file, allowing you to modify colors, spacing, and layout configurations directly.",
      span: "lg:col-span-1"
    },
    {
      question: "Are these compatible with all frameworks?",
      answer: "While designed with React Router and Tailwind CSS in mind, the modular nature of the files makes them highly adaptable.",
      span: "lg:col-span-1"
    },
    {
      question: "Is it production-ready?",
      answer: "Yes, our components are built using shadcn/ui and optimized for performance, security, and accessibility.",
      span: "lg:col-span-1"
    },
    {
      question: "Do you provide updates?",
      answer: "We frequently update our library with new presets, themes, and feature enhancements to keep your projects modern.",
      span: "lg:col-span-1"
    },
    {
      question: "Can I use this for commercial projects?",
      answer: "Yes, all presets and components are licensed for both personal and commercial use.",
      span: "lg:col-span-2"
    }
  ]

  return (
    <section>
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
        FREQUENTLY ASKED QUESTIONS
      </h2>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 ${faq.span}`}
          >
            <h3 className="mb-2 font-semibold text-foreground">
              {faq.question}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}