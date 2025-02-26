import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import { CheckCircleIcon, AlertCircle, RefreshCw } from "lucide-react";
import type { Registration } from "@shared/schema";
import { Helmet } from "react-helmet";

export default function Admin() {
  const { data: registrations, isLoading, error, refetch } = useQuery<Registration[]>({
    queryKey: ['/api/registrations'],
    refetchOnMount: true,
    staleTime: 10000, // 10 seconds
  });

  const getContactStatus = (registration: Registration) => {
    if (registration.email || registration.phone) {
      return registration.contactConsent ? (
        <div className="flex items-center text-[#2ECC71]">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          <span>Contactable</span>
        </div>
      ) : (
        <div className="flex items-center text-amber-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>No consent</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-[#9CA3AF]">
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>Anonymous</span>
      </div>
    );
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>Failed to load registrations: {(error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Helmet>
        <title>Admin Dashboard | Celebrate Recovery</title>
      </Helmet>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-[#374151]">
              Step Study Registrations
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                className="bg-primary hover:bg-blue-600 text-white"
              >
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Group Type</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations && registrations.length > 0 ? (
                    registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          {registration.name || <span className="text-[#9CA3AF]">Anonymous</span>}
                        </TableCell>
                        <TableCell>
                          <div>
                            {registration.email && (
                              <div className="text-sm">{registration.email}</div>
                            )}
                            {registration.phone && (
                              <div className="text-sm">{registration.phone}</div>
                            )}
                            {!registration.email && !registration.phone && (
                              <span className="text-[#9CA3AF]">None provided</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {registration.groupType === 'men' && 'Men\'s Group'}
                          {registration.groupType === 'women' && 'Women\'s Group'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {Array.isArray(registration.availability) && registration.availability.map(avail => (
                              <div key={avail} className="text-sm">
                                {avail === 'weekday-morning' && 'Weekday Mornings'}
                                {avail === 'weekday-afternoon' && 'Weekday Afternoons'}
                                {avail === 'weekday-evening' && 'Weekday Evenings'}
                                {avail === 'weekend-morning' && 'Weekend Mornings'}
                                {avail === 'weekend-afternoon' && 'Weekend Afternoons'}
                                {avail === 'weekend-evening' && 'Weekend Evenings'}
                              </div>
                            ))}
                            {(!Array.isArray(registration.availability) || registration.availability.length === 0) && (
                              <span className="text-[#9CA3AF]">Not specified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {registration.createdAt ? (
                            formatDistance(new Date(registration.createdAt), new Date(), { addSuffix: true })
                          ) : (
                            'Unknown'
                          )}
                        </TableCell>
                        <TableCell>
                          {getContactStatus(registration)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-primary"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-[#9CA3AF]">
                        No registrations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
