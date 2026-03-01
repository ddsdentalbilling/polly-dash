import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const departments = [
  { id: "operations", name: "Operations", icon: "📋", phase: "Phase 1", status: "Setting Up", color: "bg-blue-500" },
  { id: "it", name: "IT", icon: "💻", phase: "Phase 1", status: "Setting Up", color: "bg-purple-500" },
  { id: "finance", name: "Finance", icon: "💰", phase: "Phase 2", status: "Planned", color: "bg-green-500" },
  { id: "hr", name: "HR", icon: "👥", phase: "Phase 2", status: "Planned", color: "bg-orange-500" },
  { id: "marketing-sales", name: "Marketing & Sales", icon: "📢", phase: "Phase 2", status: "Planned", color: "bg-pink-500" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Good evening, Nina 🦜</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your DDS command center overview.</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly LLM Budget</CardDescription>
            <CardTitle className="text-2xl">$200.00</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={5} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">~$10 used · Resets monthly</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Agents</CardDescription>
            <CardTitle className="text-2xl">1 / 6</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Polly (COO) · Ops & IT coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Architecture · Polly-Dash · Agent Setup</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Departments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Link key={dept.id} href={`/departments/${dept.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{dept.icon}</span>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                    </div>
                    <Badge variant={dept.phase === "Phase 1" ? "default" : "secondary"}>
                      {dept.phase}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${dept.color}`} />
                    <span className="text-sm text-muted-foreground">{dept.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Drop files here to share with Polly →
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ActivityItem time="10:30 PM" text="Polly-Dash v0.1 deployed" agent="Polly" />
            <ActivityItem time="10:16 PM" text="Daily Squawk cron job created" agent="Polly" />
            <ActivityItem time="9:52 PM" text="Sub-agent architecture drafted" agent="Polly" />
            <ActivityItem time="9:41 PM" text="Project tracking structure created" agent="Polly" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityItem({ time, text, agent }: { time: string; text: string; agent: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-20 shrink-0">{time}</span>
      <span className="flex-1">{text}</span>
      <Badge variant="outline">{agent}</Badge>
    </div>
  );
}
