import { Link } from "react-router"

type FooterLink = {
	name: string
	path: string
	label?: string
}

const FOOTER_LINKS: FooterLink[] = [
	{ name: "Premade", path: "/premade" },
	{ name: "Themes", path: "/themes" },
	{ name: "Studio", path: "/studio", label: "Logo Recolor" },
	{ name: "Guide", path: "/guide" },
	{ name: "Forum", path: "/forum" }
]

export default function Footer() {
	return (
		<footer className="w-full border-t border-border bg-background py-10" role="contentinfo">
			<div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 px-4">
				<div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
					<h2 className="text-xl font-heading font-bold tracking-tighter text-foreground">Gaia Profile Design</h2>
					<nav className="flex flex-wrap justify-center md:justify-start gap-6 text-xs uppercase tracking-widest text-muted-foreground">
						{FOOTER_LINKS.map((item) => (
							<Link key={item.name} to={item.path} className="transition-colors hover:text-foreground">
								{item.label ?? item.name}
							</Link>
						))}
					</nav>
					<div className="flex flex-col md:flex-row items-center gap-4 border-t border-border pt-6 text-[10px] text-muted-foreground w-full">
						<p className="max-w-xs">A collection of tools and premade themes built for the Gaia Online community.</p>
						<div className="flex gap-4">
							<Link to="/privacy" className="hover:text-foreground">Privacy</Link>
							<Link to="/terms" className="hover:text-foreground">Terms</Link>
							<span>© {new Date().getFullYear()}</span>
						</div>
					</div>
				</div>
				<div className="flex shrink-0 items-center justify-center">
					<a href="http://s05.flagcounter.com/more/Mto">
						<img 
							src="https://s05.flagcounter.com/map/Mto/size_s/txt_000000/border_CCCCCC/pageviews_1/viewers_0/flags_0/" 
							alt="Flag Counter" 
							className="border border-[#CCCCCC]"
						/>
					</a>
				</div>
			</div>
		</footer>
	)
}