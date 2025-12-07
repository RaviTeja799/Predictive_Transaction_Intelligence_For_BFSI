import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Filter } from "lucide-react";

interface FilterBarProps {
  timeRange: string;
  transactionType: string;
 
  onTimeRangeChange: (value: string) => void;
  onTransactionTypeChange: (value: string) => void;
 
}

export const FilterBar = ({
  timeRange,
  transactionType,
 
  onTimeRangeChange,
  onTransactionTypeChange,

}: FilterBarProps) => {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
          <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={transactionType} onValueChange={onTransactionTypeChange}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ATM">ATM</SelectItem>
              <SelectItem value="Mobile">Mobile</SelectItem>
              <SelectItem value="Web">Web</SelectItem>
              <SelectItem value="POS">POS</SelectItem>
            </SelectContent>
          </Select>
        </div>
    
      </div>
    </Card>
  );
};
