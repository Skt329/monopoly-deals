import { Github, Linkedin, Globe, Mail, Code2, Heart } from 'lucide-react';

export function DeveloperInfo() {
  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      <div className="absolute bottom-full right-0 pb-3 w-72 opacity-0 scale-95 translate-y-4 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-400 ease-out origin-bottom-right">
        <div className="p-5 rounded-2xl bg-card border shadow-2xl">
          <div className="mb-4">
            <h4 className="font-display font-bold text-lg text-foreground tracking-tight">Saurabh Tiwari</h4>
            <p className="text-sm font-medium text-primary mt-0.5 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-primary" />
              AI Engineer & Full-Stack
            </p>
          </div>
          
          <div className="space-y-3 pt-3 border-t">
            <a href="https://skt329.github.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 p-2 -mx-2 rounded-lg transition-all">
              <Globe className="w-4 h-4" />
              <span>Portfolio</span>
            </a>
            <a href="https://linkedin.com/in/saurabht0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 p-2 -mx-2 rounded-lg transition-all">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/Skt329" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 p-2 -mx-2 rounded-lg transition-all">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a href="mailto:st108113@gmail.com" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 p-2 -mx-2 rounded-lg transition-all">
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </a>
          </div>
        </div>
      </div>
      
      <button className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card hover:bg-card/90 text-foreground shadow-lg border hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
        <Code2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold tracking-wide">Developer</span>
      </button>
    </div>
  );
}
