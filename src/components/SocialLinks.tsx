import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const socialLinks = [
  {
    name: "Instagram",
    url: "https://instagram.com/talkswithluna",
    icon: Instagram,
  },
  {
    name: "Threads",
    url: "https://threads.net/@talkswithluna",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.108-1.152 3.457-1.187 1.357-.035 2.537.339 3.516 1.102v-.972c0-1.453-.387-2.59-1.15-3.38-.737-.764-1.837-1.167-3.181-1.165l-.027-.002c-1.905.023-3.086.673-3.939 1.306l-1.237-1.634C7.816 3.418 9.627 2.51 12.155 2.49c1.973.006 3.608.597 4.86 1.753 1.27 1.17 1.912 2.762 1.912 4.733v1.473c.752.587 1.359 1.327 1.778 2.288.631 1.449.808 3.39-.33 5.504-1.407 2.609-3.985 3.674-7.345 3.758h-.844zm.39-7.77c-.944.024-1.72.272-2.245.718-.478.406-.705.922-.676 1.535.039.703.376 1.241.975 1.554.622.325 1.419.43 2.242.39 1.08-.059 1.895-.453 2.42-1.173.377-.517.633-1.18.759-1.976-.64-.326-1.408-.533-2.28-.57-.368-.033-.739-.04-1.105-.028l-.09-.45z"/>
      </svg>
    ),
  },
  {
    name: "X",
    url: "https://x.com/talkswithluna",
    icon: Twitter,
  },
  {
    name: "Facebook",
    url: "https://facebook.com/talkswithluna",
    icon: Facebook,
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@TalksWithLunaAI",
    icon: Youtube,
  },
];

interface SocialLinksProps {
  showLabels?: boolean;
  className?: string;
}

const SocialLinks = ({ showLabels = false, className = "" }: SocialLinksProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
            aria-label={`Follow us on ${social.name}`}
          >
            <Icon className="w-5 h-5" />
            {showLabels && <span className="text-sm">{social.name}</span>}
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
