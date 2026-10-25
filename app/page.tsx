import Link from 'next/link';
import { 
  GitCommit, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default async function LandingPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  // Visual sample cells for the mock banner graph
  const samplePattern = [
    [0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 0, 2, 4, 4, 2, 0, 0, 1, 3, 4, 3, 1, 0],
    [1, 2, 3, 4, 4, 4, 3, 2, 1, 0, 1, 3, 4, 4, 3, 1, 0, 2, 4, 4, 4, 2, 0],
    [2, 3, 4, 4, 4, 4, 4, 3, 2, 0, 2, 4, 4, 4, 4, 2, 0, 3, 4, 4, 4, 3, 0],
    [3, 4, 4, 4, 4, 4, 4, 4, 3, 0, 3, 4, 4, 4, 4, 3, 0, 4, 4, 4, 4, 4, 0],
    [2, 3, 4, 4, 4, 4, 4, 3, 2, 0, 2, 4, 4, 4, 4, 2, 0, 3, 4, 4, 4, 3, 0],
    [1, 2, 3, 4, 4, 4, 3, 2, 1, 0, 1, 3, 4, 4, 3, 1, 0, 2, 4, 4, 4, 2, 0],
    [0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 0, 2, 4, 4, 2, 0, 0, 1, 3, 4, 3, 1, 0],
  ];

  const getColorClass = (level: number) => {
    switch (level) {
      case 1: return 'bg-[#0e4429]';
      case 2: return 'bg-[#006d32]';
      case 3: return 'bg-[#26a641]';
      case 4: return 'bg-[#39d353] shadow-[0_0_8px_rgba(57,211,83,0.3)]';
      default: return 'bg-[#161b22]';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9]">
      {/* Top Navigation */}
      <header className="border-b border-[#30363d] bg-[#161b22]/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center text-white shadow-md shadow-[#238636]/20">
              <GitCommit className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-2">
              commit-bot<span className="text-[#39d353] font-mono text-sm">.web</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/api/auth/github" 
              className={buttonVariants({
                variant: 'outline',
                className: 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-white flex items-center gap-2'
              })}
            >
              <GithubIcon className="w-4 h-4" />
              <span>Connect GitHub</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 flex flex-col items-center">
        {/* Error Alert if redirected with error */}
        {error && (
          <div className="w-full max-w-2xl mb-8">
            <Alert variant="destructive" className="bg-red-950/40 border-red-800 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Issue</AlertTitle>
              <AlertDescription>
                {error === 'no_code'
                  ? 'No authorization code was provided by GitHub.'
                  : error === 'server_configuration_error'
                  ? 'GitHub OAuth is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
                  : `Failed to authenticate with GitHub: ${error}`}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center max-w-3xl pt-6 pb-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#238636]/40 bg-[#0e4429]/30 text-[#39d353] text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Graph Canvas & Commit Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Paint Your GitHub Graph <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#39d353] via-[#26a641] to-[#2ea043] bg-clip-text text-transparent">
              Green & Vibrant 🟩
            </span>
          </h1>

          <p className="text-lg text-[#8b949e] mb-8 leading-relaxed max-w-2xl">
            A standalone web app to draw shapes, write text, convert images, and execute backdated commits via the GitHub Git Data API. No local git installation needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              href="/api/auth/github" 
              className={buttonVariants({
                variant: 'default',
                size: 'lg',
                className: 'bg-[#238636] hover:bg-[#2ea043] text-white font-medium px-8 h-12 shadow-lg shadow-[#238636]/25 text-base flex items-center gap-2'
              })}
            >
              <GithubIcon className="w-5 h-5" />
              <span>Login with GitHub</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <a 
              href="#features" 
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] h-12'
              })}
            >
              Explore Features
            </a>
          </div>

          <p className="text-xs text-[#8b949e] mt-4 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#3fb950]" />
            OAuth tokens are stored in secure, encrypted httpOnly session cookies.
          </p>
        </section>

        {/* Visual Graph Showcase */}
        <section className="w-full max-w-4xl p-6 rounded-2xl border border-[#30363d] bg-[#161b22]/80 backdrop-blur-sm shadow-2xl mb-16 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f85149]" />
              <div className="w-3 h-3 rounded-full bg-[#d29922]" />
              <div className="w-3 h-3 rounded-full bg-[#2ea043]" />
              <span className="text-xs font-mono text-[#8b949e] ml-2">interactive-canvas.preview</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-[#161b22] border border-[#30363d]" />
              <div className="w-3 h-3 rounded-sm bg-[#0e4429]" />
              <div className="w-3 h-3 rounded-sm bg-[#006d32]" />
              <div className="w-3 h-3 rounded-sm bg-[#26a641]" />
              <div className="w-3 h-3 rounded-sm bg-[#39d353]" />
              <span>More</span>
            </div>
          </div>

          <div className="flex justify-center overflow-x-auto py-2">
            <div className="flex gap-[4px] p-2 bg-[#0d1117] rounded-lg border border-[#30363d]/60">
              {samplePattern[0].map((_, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-[4px]">
                  {samplePattern.map((row, rowIndex) => {
                    const level = row[colIndex];
                    return (
                      <div
                        key={rowIndex}
                        className={`w-3.5 h-3.5 rounded-xs transition-all duration-300 hover:scale-125 hover:z-10 ${getColorClass(level)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-[#8b949e]">
              ✨ Render custom graphics directly onto your official GitHub contribution heatmap
            </span>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section id="features" className="w-full max-w-5xl mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Full Creative Freedom on Your Graph
            </h2>
            <p className="text-sm text-[#8b949e]">
              Equipped with drawing tools, generators, and sequential GitHub Git Data API execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-[#388bfd] transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-[#0e4429] flex items-center justify-center text-[#39d353] mb-2">
                  <Palette className="w-5 h-5" />
                </div>
                <CardTitle className="text-white text-lg">Interactive Painting</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  Click or drag directly across all 52 weeks. Choose commit intensities and watch queued cells highlight in real time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-[#388bfd] transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-[#0e4429] flex items-center justify-center text-[#39d353] mb-2">
                  <Type className="w-5 h-5" />
                </div>
                <CardTitle className="text-white text-lg">Text & Shapes</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  Generate pixel-perfect text letters with a 5×7 font, or pick from presets like hearts, stars, checkmarks, and skulls.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-[#388bfd] transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-[#0e4429] flex items-center justify-center text-[#39d353] mb-2">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <CardTitle className="text-white text-lg">Browser Image Converter</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  Drop any PNG or JPEG. The client-side Canvas API resizes it to 7 rows and maps grayscale intensities to commits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-[#388bfd] transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-[#0e4429] flex items-center justify-center text-[#39d353] mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <CardTitle className="text-white text-lg">Year Fill & Scatter</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  Quickly fill full calendar years with randomized organic activity, or scatter commits across weekdays.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-[#388bfd] transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-[#0e4429] flex items-center justify-center text-[#39d353] mb-2">
                  <GitCommit className="w-5 h-5" />
                </div>
                <CardTitle className="text-white text-lg">Sequential Git Data API</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  Blobs, trees, and backdated commits are chained sequentially via Octokit, updating branch refs with force: true.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-[#388bfd] transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-[#0e4429] flex items-center justify-center text-[#39d353] mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-white text-lg">Security & Privacy</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  OAuth tokens are stored strictly in httpOnly cookies. Client secrets and tokens are never exposed to browser JS.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] py-8 text-xs text-[#8b949e]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} commit-bot-web. Built for educational and creative GitHub profile customization.</p>
          <div className="flex items-center gap-4">
            <Link href="/api/auth/github" className="hover:text-white transition-colors">
              Connect Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
