import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Bell, Shield, Dumbbell, Globe, LogOut } from "lucide-react";

export default function SettingsPage() {
  // todo: remove mock functionality
  const [notifications, setNotifications] = useState(true);
  const [outdoorWorkouts, setOutdoorWorkouts] = useState(false);
  const [noiseRestriction, setNoiseRestriction] = useState(true);
  const [spaceRestriction, setSpaceRestriction] = useState("limited");

  const handleLogout = () => {
    console.log("Logout triggered");
  };

  const handleExportData = () => {
    console.log("Export data triggered");
  };

  const handleDeleteAccount = () => {
    console.log("Delete account triggered");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Username</p>
                <p className="text-sm text-muted-foreground">fitness_user</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-edit-profile">
                Edit
              </Button>
            </div>
            <div>
              <p className="font-medium mb-2">Fitness Goals</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Strength Building</Badge>
                <Badge variant="secondary">Weight Loss</Badge>
                <Badge variant="outline">Muscle Gain</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Workout Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="outdoor-workouts">Outdoor Workouts</Label>
                <p className="text-sm text-muted-foreground">
                  Include running and outdoor exercises
                </p>
              </div>
              <Switch
                id="outdoor-workouts"
                checked={outdoorWorkouts}
                onCheckedChange={setOutdoorWorkouts}
                data-testid="switch-outdoor-workouts"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="noise-restriction">Quiet Workouts</Label>
                <p className="text-sm text-muted-foreground">
                  Avoid noisy exercises (jumping, etc.)
                </p>
              </div>
              <Switch
                id="noise-restriction"
                checked={noiseRestriction}
                onCheckedChange={setNoiseRestriction}
                data-testid="switch-noise-restriction"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Available Space</Label>
              <div className="flex gap-2 mt-2">
                {["limited", "moderate", "large"].map((space) => (
                  <Button
                    key={space}
                    variant={spaceRestriction === space ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpaceRestriction(space)}
                    data-testid={`button-space-${space}`}
                  >
                    {space.charAt(0).toUpperCase() + space.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Workout Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about scheduled workouts
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExportData}
              data-testid="button-export-data"
            >
              Export My Data
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive"
              onClick={handleDeleteAccount}
              data-testid="button-delete-account"
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              className="w-full justify-center gap-2"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}