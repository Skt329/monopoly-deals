import { Github, Linkedin, Globe, Mail, Code2, Heart } from 'lucide-react';

export function DeveloperInfo() {
  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      <div className="absolute bottom-full right-0 sm:right-0 pb-3 w-[calc(100vw-2rem)] sm:w-72 max-w-xs sm:max-w-none opacity-0 scale-95 translate-y-4 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-400 ease-out origin-bottom-right">
        <div className="p-5 rounded-2xl bg-[#0a1f18]/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
          <div className="mb-4">
            <h4 className="font-display font-bold text-lg text-white tracking-tight">Saurabh Tiwari</h4>
            <p className="text-sm font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              AI Engineer & Full-Stack
            </p>
          </div>
          
          <div className="space-y-3 pt-3 border-t border-white/10">
            <a href="https://skt329.github.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 p-2 -mx-2 rounded-lg transition-all">
              <Globe className="w-4 h-4" />
              <span>Portfolio</span>
            </a>
            <a href="https://linkedin.com/in/saurabht0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 p-2 -mx-2 rounded-lg transition-all">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/Skt329" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 p-2 -mx-2 rounded-lg transition-all">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a href="mailto:st108113@gmail.com" className="flex items-center gap-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 p-2 -mx-2 rounded-lg transition-all">
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </a>
          </div>
        </div>
      </div>
      
      <button className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0a1f18]/60 backdrop-blur-lg hover:bg-[#0a1f18]/80 text-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/10 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-all duration-300 transform hover:-translate-y-1 ring-1 ring-white/5">
        <Code2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold tracking-wide">Developer</span>
      </button>
    </div>
  );
}
