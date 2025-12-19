import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Shield, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

interface AuthButtonProps {
  buttonText?: string;
  className?: string;
}

export function AuthButton({ buttonText = "Account", className }: AuthButtonProps) {
  const { user, login, register, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isSignUp) {
        await login(email, password);
        setIsOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Signed in successfully!"
        });
      } else {
        // Validate signup fields
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        await register(email, password, fullName);
        setIsOpen(false);
        resetForm();
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully"
    });
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-salmon/20">
            <Avatar className="h-10 w-10 border-2 border-salmon/40">
              <AvatarFallback className="bg-salmon text-white font-bold">
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
            <Settings className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
          {user.role === "staff" && (
            <DropdownMenuItem onClick={() => setLocation("/admin")}>
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className || "bg-salmon text-white hover:bg-salmon-muted"}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isSignUp ? "Create Account" : "Sign In"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Minimum 8 characters" : "Your password"}
                required
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <Button
            type="submit"
            className={`w-full ${isSignUp ? "bg-cyan text-white hover:bg-cyan-muted" : "bg-salmon text-white hover:bg-salmon-muted"}`}
            disabled={loading}
          >
            {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
          </Button>
          <div className="text-center space-y-2">
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="text-sm text-cyan hover:text-salmon transition-colors duration-300 block w-full"
              >
                Forgot your password?
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetForm();
                setShowForgotPassword(false);
              }}
              className="text-sm text-cyan hover:text-salmon transition-colors duration-300"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        </form>
        
        {showForgotPassword && (
          <div className="mt-4 p-4 bg-cyan-dark/20 border border-cyan/30 rounded-lg">
            <h3 className="text-sm font-semibold text-salmon mb-2">Reset Password</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Contact our support team to reset your password. Please include your email address and we'll help you regain access.
            </p>
            <div className="space-y-2 text-xs">
              <p><strong className="text-salmon">Email:</strong> support@slyfoxstudios.co.za</p>
              <p><strong className="text-salmon">Phone:</strong> +27 31 123 4567</p>
              <p><strong className="text-salmon">WhatsApp:</strong> +27 82 987 6543</p>
            </div>
            <Button 
              onClick={() => setShowForgotPassword(false)}
              variant="outline"
              size="sm"
              className="mt-3 w-full border-border hover:border-salmon text-white"
            >
              Got it, thanks
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
