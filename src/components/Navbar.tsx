import { User, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav 
      className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-between bg-background/60 backdrop-blur-xl border border-border/50 rounded-full shadow-lg transition-all duration-300 max-w-4xl w-[95%] px-8 ${
        isScrolled 
          ? "top-4 py-2" 
          : "top-8 py-5"
      }`}
    >
      <div className="flex items-center gap-8">
        <Link 
          to="/" 
          className={`font-heading font-bold text-gradient-pink tracking-tight hover:scale-105 transition-all ${
            isScrolled ? "text-xl" : "text-3xl"
          }`}
        >
          pixematch
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`font-medium text-foreground/90 hover:text-foreground transition-colors relative group ${
              isScrolled ? "text-xs px-2 py-1" : "text-base px-3 py-2"
            }`}
          >
            Home
            <span className="absolute -bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link 
            to="/matching" 
            className={`font-medium text-foreground/70 hover:text-foreground transition-colors relative group ${
              isScrolled ? "text-xs px-2 py-1" : "text-base px-3 py-2"
            }`}
          >
            Find Match
            <span className="absolute -bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <a 
            href="#features" 
            className={`font-medium text-foreground/70 hover:text-foreground transition-colors relative group ${
              isScrolled ? "text-xs px-2 py-1" : "text-base px-3 py-2"
            }`}
          >
            Features
            <span className="absolute -bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
        </div>
      </div>

      <div className="flex items-center">
        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 hover:bg-secondary/50 rounded-full transition-all ${
                  isScrolled ? "h-8 px-3" : "h-12 px-5"
                }`}
              >
                <div className={`rounded-full bg-gradient-to-br from-primary to-pink-deep flex items-center justify-center font-bold text-white ${
                  isScrolled ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-sm"
                }`}>
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className={`text-foreground hidden sm:inline max-w-[100px] truncate ${
                  isScrolled ? "text-xs" : "text-base"
                }`}>
                  {user?.name || "User"}
                </span>
                <ChevronDown className={`text-muted-foreground ${
                  isScrolled ? "w-3 h-3" : "w-4 h-4"
                }`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/matching")}
                className="cursor-pointer text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Matching
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            className={`gap-2 bg-primary hover:bg-pink-deep text-primary-foreground glow-pink-sm shadow-lg rounded-full transition-all ${
              isScrolled ? "h-8 px-4 text-xs" : "h-12 px-6 text-base"
            }`}
            onClick={() => navigate("/login")}
          >
            <LogIn className={isScrolled ? "w-3.5 h-3.5" : "w-5 h-5"} />
            Log in
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
