
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LabourCardSkeleton() {
  return (
    <Card className="w-full overflow-hidden shadow-lg flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3 mb-2" />
        <div className="flex flex-wrap gap-2 pl-6">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4 pt-2" />
        <Skeleton className="h-4 w-1/2 pt-2" />
      </CardContent>
      <CardFooter className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
        <Skeleton className="h-9 w-full sm:w-auto sm:flex-1" />
      </CardFooter>
    </Card>
  );
}
