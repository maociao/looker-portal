import React from 'react';

// shadcn components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Lucide icons
import { BarChart3, LineChart, PieChart, ExternalLink } from 'lucide-react';

const DashboardSelector = ({ dashboards, onSelectDashboard, className }) => {
  // Function to get an appropriate icon based on dashboard type
  const getDashboardIcon = (type) => {
    switch (type) {
      case 'sales':
        return <BarChart3 className="h-10 w-10 text-primary" />;
      case 'marketing':
        return <LineChart className="h-10 w-10 text-green-500" />;
      case 'customer':
        return <PieChart className="h-10 w-10 text-blue-500" />;
      default:
        return <BarChart3 className="h-10 w-10 text-gray-500" />;
    }
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {dashboards.map((dashboard) => (
        <Card key={dashboard.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              {getDashboardIcon(dashboard.dashboardType)}
              <div className="text-xs text-gray-500">
                ID: {dashboard.id}
              </div>
            </div>
            <CardTitle className="text-lg mt-3">{dashboard.title}</CardTitle>
            <CardDescription>
              {dashboard.description}
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-4 pb-6 bg-slate-50">
            <Button 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => onSelectDashboard(dashboard.id)}
            >
              View Dashboard
              <ExternalLink size={16} />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default DashboardSelector;