import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application settings and configurations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general application preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/general">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Management</CardTitle>
            <CardDescription>
              Manage social media platforms and content types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/social-media">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Manage teams and club associations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/teams">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sponsor Management</CardTitle>
            <CardDescription>
              Manage sponsors and their properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/sponsors">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Management</CardTitle>
            <CardDescription>
              Manage detection models and training settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/models">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Season Management</CardTitle>
            <CardDescription>
              Manage seasons and their date ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/seasons">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sponsorship Types</CardTitle>
            <CardDescription>
              Define and manage sponsorship types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/sponsorship-types">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detection Settings</CardTitle>
            <CardDescription>
              Configure detection parameters and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/detection">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MCP Setup</CardTitle>
            <CardDescription>
              Configure Claude Desktop to access Touchline data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/mcp">
              <Button variant="outline" size="sm">
                View Setup Guide
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
