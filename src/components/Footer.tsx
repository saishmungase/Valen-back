const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-gradient-pink mb-1">pixematch</h3>
            <p className="text-xs text-muted-foreground">Video Chat & Meet New People</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Safety Tips</a>
            <a href="#" className="hover:text-foreground transition-colors">Community Guidelines</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 PixeMatch. All rights reserved. All images are of models and used for illustrative purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
