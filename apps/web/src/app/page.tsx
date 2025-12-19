export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Systemize
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Stay Organized, Stay Ahead
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-accent transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}
