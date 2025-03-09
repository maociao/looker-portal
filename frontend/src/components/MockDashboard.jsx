// src/components/MockDashboard.jsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const MockDashboard = ({ dashboardId }) => {
  // Content for different dashboard types
  const dashboardTypes = {
    '1': {
      title: 'Sales Overview Dashboard',
      lastUpdated: 'March 9, 2025',
      charts: [
        { type: 'bar', title: 'Monthly Revenue', data: [60, 75, 68, 80, 85, 92, 88, 95, 110, 102, 115, 108] },
        { type: 'bar', title: 'Top Products', items: [
          { name: 'Product A', value: 85 },
          { name: 'Product B', value: 65 },
          { name: 'Product C', value: 45 },
          { name: 'Product D', value: 35 },
          { name: 'Product E', value: 25 }
        ]},
        { type: 'pie', title: 'Sales by Region', items: [
          { name: 'North', value: 35, color: 'chart-1' },
          { name: 'East', value: 30, color: 'chart-2' },
          { name: 'South', value: 15, color: 'chart-3' },
          { name: 'West', value: 20, color: 'chart-4' }
        ]}
      ]
    },
    '2': {
      title: 'Marketing Performance',
      lastUpdated: 'March 7, 2025',
      charts: [
        { type: 'line', title: 'Campaign Performance', data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 100, 120, 115] },
        { type: 'bar', title: 'Lead Sources', items: [
          { name: 'Organic Search', value: 70 },
          { name: 'Paid Search', value: 55 },
          { name: 'Social Media', value: 45 },
          { name: 'Email', value: 35 },
          { name: 'Referral', value: 25 }
        ]},
        { type: 'pie', title: 'Marketing Budget Allocation', items: [
          { name: 'Digital', value: 45, color: 'chart-2' },
          { name: 'TV & Radio', value: 25, color: 'chart-1' },
          { name: 'PR', value: 15, color: 'chart-4' },
          { name: 'Events', value: 15, color: 'chart-3' }
        ]}
      ]
    },
    '3': {
      title: 'Customer Analytics',
      lastUpdated: 'March 8, 2025',
      charts: [
        { type: 'bar', title: 'Customer Lifetime Value', data: [95, 83, 78, 91, 85, 92, 79, 88, 94, 80, 85, 89] },
        { type: 'bar', title: 'Customer Segments', items: [
          { name: 'Premium', value: 30 },
          { name: 'Standard', value: 45 },
          { name: 'Basic', value: 25 }
        ]},
        { type: 'pie', title: 'Age Demographics', items: [
          { name: '18-24', value: 15, color: 'chart-1' },
          { name: '25-34', value: 35, color: 'chart-2' },
          { name: '35-44', value: 25, color: 'chart-3' },
          { name: '45+', value: 25, color: 'chart-4' }
        ]}
      ]
    }
  };

  // Default to dashboard 1 if not specified
  const dashboardContent = dashboardTypes[dashboardId] || dashboardTypes['1'];
  
  return (
    <Card className="w-full h-[800px] overflow-hidden">
      <CardContent className="p-0 h-full">
        <div className="flex flex-col h-full">
          {/* Mock Dashboard Header */}
          <div className="bg-gray-100 p-4 border-b">
            <h3 className="text-lg font-medium">{dashboardContent.title}</h3>
            <p className="text-sm text-gray-500">Last updated: {dashboardContent.lastUpdated}</p>
          </div>
          
          {/* Mock Dashboard Content */}
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 bg-white">
            {dashboardContent.charts.map((chart, index) => {
              if (chart.type === 'bar' && Array.isArray(chart.data)) {
                // Monthly/time-based bar chart
                return (
                  <div key={index} className="border rounded-md p-4 col-span-2 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="mb-2">
                      <h4 className="text-md font-medium">{chart.title}</h4>
                    </div>
                    <div className="h-48 flex items-end space-x-2">
                      {chart.data.map((value, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-primary" 
                            style={{ height: `${value}%`, maxHeight: '100%' }}
                          ></div>
                          <span className="text-xs mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (chart.type === 'bar' && chart.items) {
                // Item comparison bar chart
                return (
                  <div key={index} className="border rounded-md p-4 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="mb-2">
                      <h4 className="text-md font-medium">{chart.title}</h4>
                    </div>
                    <div className="space-y-4 mt-4">
                      {chart.items.map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span>${(item.value * 1250).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-chart-1 h-2 rounded-full"
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (chart.type === 'pie') {
                // Pie chart
                return (
                  <div key={index} className="border rounded-md p-4 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="mb-2">
                      <h4 className="text-md font-medium">{chart.title}</h4>
                    </div>
                    <div className="h-48 flex items-center justify-center">
                      <div className="relative w-40 h-40 rounded-full border-8 border-chart-1">
                        {chart.items.map((item, i) => {
                          const percent = i === 0 ? 100 : 
                            Math.floor(100 * chart.items.slice(0, i).reduce((sum, curr) => sum + curr.value, 0) / 
                            chart.items.reduce((sum, curr) => sum + curr.value, 0));
                          
                          return (
                            <div key={i} 
                              className={`absolute top-0 left-0 w-full h-full rounded-full border-8 border-${item.color}`} 
                              style={{ clipPath: `polygon(0 0, 100% 0, 100% ${percent}%, 0 ${percent}%)` }}>
                            </div>
                          );
                        })}
                      </div>
                      <div className="ml-4 space-y-2 text-sm">
                        {chart.items.map((item, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`w-3 h-3 bg-${item.color} mr-2`}></div> 
                            {item.name}: {item.value}%
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              } else if (chart.type === 'line') {
                // Line chart
                return (
                  <div key={index} className="border rounded-md p-4 col-span-2 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="mb-2">
                      <h4 className="text-md font-medium">{chart.title}</h4>
                    </div>
                    <div className="h-48 flex items-end space-x-1">
                      {chart.data.map((value, i) => {
                        const prevValue = i > 0 ? chart.data[i - 1] : value;
                        const height = `${value}%`;
                        const prevHeight = `${prevValue}%`;
                        
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="relative w-full h-full">
                              {i > 0 && (
                                <div className="absolute bottom-0 w-full">
                                  <svg height="100%" width="100%">
                                    <line
                                      x1="0%"
                                      y1={`calc(100% - ${prevHeight})`}
                                      x2="100%"
                                      y2={`calc(100% - ${height})`}
                                      stroke="#2563eb"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </div>
                              )}
                              <div 
                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-600"
                                style={{ bottom: height }}
                              ></div>
                            </div>
                            <span className="text-xs mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MockDashboard;