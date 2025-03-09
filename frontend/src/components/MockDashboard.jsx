// src/components/MockDashboard.jsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const MockDashboard = () => {
  return (
    <Card className="w-full h-[800px] overflow-hidden">
      <CardContent className="p-0 h-full">
        <div className="flex flex-col h-full">
          {/* Mock Dashboard Header */}
          <div className="bg-gray-100 p-4 border-b">
            <h3 className="text-lg font-medium">Sales Overview Dashboard</h3>
            <p className="text-sm text-gray-500">Last updated: March 9, 2025</p>
          </div>
          
          {/* Mock Dashboard Content */}
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 bg-white">
            {/* Mock Chart 1 */}
            <div className="border rounded-md p-4 col-span-2 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="mb-2">
                <h4 className="text-md font-medium">Monthly Revenue</h4>
              </div>
              <div className="h-48 flex items-end space-x-2">
                {[60, 75, 68, 80, 85, 92, 88, 95, 110, 102, 115, 108].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary" 
                      style={{ height: `${value}%`, maxHeight: '100%' }}
                    ></div>
                    <span className="text-xs mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mock Chart 2 */}
            <div className="border rounded-md p-4 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="mb-2">
                <h4 className="text-md font-medium">Top Products</h4>
              </div>
              <div className="space-y-4 mt-4">
                {[
                  { name: 'Product A', value: 85 },
                  { name: 'Product B', value: 65 },
                  { name: 'Product C', value: 45 },
                  { name: 'Product D', value: 35 },
                  { name: 'Product E', value: 25 }
                ].map((product, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{product.name}</span>
                      <span>${(product.value * 1250).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-chart-1 h-2 rounded-full"
                        style={{ width: `${product.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mock Chart 3 */}
            <div className="border rounded-md p-4 h-64 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="mb-2">
                <h4 className="text-md font-medium">Sales by Region</h4>
              </div>
              <div className="h-48 flex items-center justify-center">
                <div className="relative w-40 h-40 rounded-full border-8 border-chart-1">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-chart-2" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 70%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-chart-3" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 40%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-chart-4" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 25%, 0 25%)' }}></div>
                </div>
                <div className="ml-4 space-y-2 text-sm">
                  <div className="flex items-center"><div className="w-3 h-3 bg-chart-1 mr-2"></div> North: 35%</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-chart-2 mr-2"></div> East: 30%</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-chart-3 mr-2"></div> South: 15%</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-chart-4 mr-2"></div> West: 20%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MockDashboard;