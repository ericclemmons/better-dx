import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-32 md:pt-32 md:pb-40 lg:pt-40 lg:pb-48">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-8 font-display font-medium text-[clamp(2.5rem,8vw,5.5rem)] text-foreground leading-[0.95] tracking-tight">
            A better developer
            <br />
            experience
          </h1>
          <p className="mx-auto mb-12 max-w-2xl font-light font-serif text-[clamp(1.125rem,2.5vw,1.5rem)] text-muted-foreground leading-relaxed">
            Stay focused on building your product, not juggling terminal windows
            and processes. <span className="italic">better-dev</span>{" "}
            automatically integrates the tools you already use.
          </p>
          <div className="mx-auto max-w-md">
            <p className="mb-3 font-display font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Get Started
            </p>
            <div className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/40">
              <div className="flex items-center gap-3 px-6 py-5">
                <span className="font-mono text-muted-foreground text-sm">
                  $
                </span>
                <code className="font-medium font-mono text-foreground text-lg">
                  npx better-dev
                </code>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-y bg-card/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-display font-medium text-accent-foreground/60 text-sm uppercase tracking-wider">
              For Builders
            </p>
            <h2 className="mb-12 font-display font-medium text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
              Build products,
              <br />
              not infrastructure
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-16">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
                <svg
                  className="h-6 w-6 text-accent-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <h3 className="font-display font-medium text-2xl tracking-tight">
                Unified development panel
              </h3>
              <p className="font-serif text-lg text-muted-foreground leading-relaxed">
                Access server logs, AI assistance, and build status all in one
                place. No more switching between terminal tabs.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
                <svg
                  className="h-6 w-6 text-accent-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                  <polyline points="7.5 19.79 7.5 14.6 3 12" />
                  <polyline points="21 12 16.5 14.6 16.5 19.79" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" x2="12" y1="22.08" y2="12" />
                </svg>
              </div>
              <h3 className="font-display font-medium text-2xl tracking-tight">
                Zero configuration
              </h3>
              <p className="font-serif text-lg text-muted-foreground leading-relaxed">
                Automatically detects and integrates with your existing setup.
                Works with what you already have.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
                <svg
                  className="h-6 w-6 text-accent-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect height="18" rx="2" width="18" x="3" y="3" />
                  <path d="m9 9 3 3-3 3" />
                  <path d="M15 15h3" />
                </svg>
              </div>
              <h3 className="font-display font-medium text-2xl tracking-tight">
                DevTools from a prompt
              </h3>
              <p className="font-serif text-lg text-muted-foreground leading-relaxed">
                Generate custom browser devtools panels on-demand with natural
                language. Build exactly what you need, when you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 font-display font-medium text-accent-foreground/60 text-sm uppercase tracking-wider">
              Integrations
            </p>
            <h2 className="mb-6 font-display font-medium text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
              Works with your stack
            </h2>
            <p className="mx-auto max-w-2xl font-light font-serif text-lg text-muted-foreground">
              Seamlessly connects with the tools you rely on every day
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "OpenCode",
                description: "Server logs & UI context",
                icon: (
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m7 11 5-5 5 5M7 17l5-5 5 5" />
                  </svg>
                ),
              },
              {
                name: "Turborepo",
                description: "Monorepo build system",
                icon: (
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                ),
              },
              {
                name: "AI SDK",
                description: "Language model integration",
                icon: (
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
              },
              {
                name: "TanStack",
                description: "Data fetching & routing",
                icon: (
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                  </svg>
                ),
              },
            ].map((integration) => (
              <div
                className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-accent/50 hover:shadow-accent/5 hover:shadow-lg"
                key={integration.name}
              >
                <div className="mb-4 text-accent-foreground">
                  {integration.icon}
                </div>
                <h3 className="mb-2 font-display font-medium text-xl">
                  {integration.name}
                </h3>
                <p className="font-serif text-muted-foreground text-sm">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chat Demo */}
      <section className="border-y bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <span className="font-display font-medium text-accent-foreground/80 text-sm uppercase tracking-wider">
                Interactive Demo
              </span>
            </div>
            <h2 className="mb-6 font-display font-medium text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-tight">
              AI assistance, built in
            </h2>
            <p className="mx-auto max-w-2xl font-light font-serif text-lg text-muted-foreground">
              Chat with AI directly in your dev panel. Get help with debugging,
              code generation, and more.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <AIChatDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-6 font-display font-medium text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
              Everything you need
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Server logs streaming",
                description:
                  "Stream server logs directly to your browser. Debug faster with real-time visibility.",
              },
              {
                title: "Chrome DevTools MCP",
                description:
                  "Deep integration with Chrome DevTools for advanced debugging capabilities.",
              },
              {
                title: "React Grab",
                description:
                  "Give OpenCode precise UI context with automatic React component detection.",
              },
              {
                title: "Process management",
                description:
                  "Automatically manages dev servers, build watchers, and background processes.",
              },
              {
                title: "Smart notifications",
                description:
                  "Get notified about build errors, test failures, and important events.",
              },
              {
                title: "Context-aware AI",
                description:
                  "AI assistant understands your codebase, current task, and recent changes.",
              },
            ].map((feature, index) => (
              <div className="space-y-3" key={index}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                </div>
                <h3 className="font-display font-medium text-xl">
                  {feature.title}
                </h3>
                <p className="font-serif text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Status Footer */}
      <section className="border-t py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"} ${healthCheck.data ? "animate-pulse" : ""}`}
            />
            <span className="font-serif text-muted-foreground">
              {healthCheck.isLoading
                ? "Checking API status..."
                : healthCheck.data
                  ? "All systems operational"
                  : "API disconnected"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function AIChatDemo() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/ai`,
    }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      return;
    }
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
      <div className="h-[400px] overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Sparkles className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="mb-2 font-medium font-serif text-lg">
              Start a conversation
            </p>
            <p className="max-w-sm font-serif text-muted-foreground text-sm">
              Ask me anything about your code, debugging, or development
              workflow
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                className={`rounded-xl p-4 ${
                  message.role === "user"
                    ? "ml-8 bg-primary/5"
                    : "mr-8 bg-accent/5"
                }`}
                key={message.id}
              >
                <p className="mb-2 font-display font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </p>
                <div className="font-serif leading-relaxed">
                  {message.parts?.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <Streamdown
                          isAnimating={
                            status === "streaming" &&
                            message.role === "assistant"
                          }
                          key={index}
                        >
                          {part.text}
                        </Streamdown>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t bg-background/50 p-4"
        onSubmit={handleSubmit}
      >
        <Input
          autoComplete="off"
          className="flex-1 border-0 bg-transparent font-serif text-base shadow-none focus-visible:ring-0"
          name="prompt"
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          value={input}
        />
        <Button
          className="h-10 w-10 rounded-xl"
          size="icon"
          type="submit"
          variant="default"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
