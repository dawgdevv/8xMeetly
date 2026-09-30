import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Auto-join meetings",
    description: "Paste a Google Meet link — Meetly's bot joins, records, and transcribes.",
    icon: "🤖",
  },
  {
    title: "AI summaries",
    description: "Concise summaries, key topics, and explicit decisions. No inventing facts.",
    icon: "✨",
  },
  {
    title: "Action items",
    description: "Commitments and owners extracted automatically from the conversation.",
    icon: "✅",
  },
  {
    title: "Searchable history",
    description: "Every meeting archived with a searchable transcript. Ask AI anything.",
    icon: "🔍",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">Meetly AI</span>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-muted hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how" className="text-sm text-muted hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="/login">
              <Button variant="outline" size="sm">Log in</Button>
            </a>
            <a href="/register">
              <Button size="sm">Get Started</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Never take{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              meeting notes
            </span>{" "}
            again
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Paste a Google Meet link → Meetly joins → transcript is generated →
            AI produces notes and action items.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/register">
              <Button size="lg">Get Started</Button>
            </a>
            <a href="#how">
              <Button variant="outline" size="lg">How it works</Button>
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What you get</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <ol className="space-y-4 text-muted">
            <li className="flex gap-3"><span className="text-primary font-bold">1.</span> Sign up and open your dashboard.</li>
            <li className="flex gap-3"><span className="text-primary font-bold">2.</span> Create a meeting and paste your Google Meet URL.</li>
            <li className="flex gap-3"><span className="text-primary font-bold">3.</span> Meetly&apos;s bot joins, records, and transcribes.</li>
            <li className="flex gap-3"><span className="text-primary font-bold">4.</span> AI generates summary, decisions, and action items.</li>
          </ol>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} Meetly AI. MVP.
        </div>
      </footer>
    </div>
  );
}
