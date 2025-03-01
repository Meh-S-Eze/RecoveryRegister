import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import { 
  CheckCircleIcon, 
  AlertCircle, 
  RefreshCw, 
  PlusIcon, 
  CalendarIcon, 
  UserIcon, 
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  EditIcon,
  TrashIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  ExternalLinkIcon,
  RepeatIcon,
  LogOutIcon
} from "lucide-react";
import type { Registration, StudySession, InsertStudySession } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { InputDatePicker } from "@/components/ui/date-picker";
import { DaySelector, type DayOfWeek } from "@/components/ui/day-selector";
import { AdminLogin } from "@/components/AdminLogin";

// Form schemas for study session management
const studySessionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().min(3, "Location is required"), // General location name
  address: z.string().optional(), // Specific street address
  
  // New fields for structured date selection
  startDate: z.date().optional(),
  recurringDay: z.string().optional(),
  isRecurring: z.boolean().default(true),
  
  // Keep legacy date field for backward compatibility
  date: z.string().min(3, "Date information is required"),
  
  time: z.string().min(3, "Time information is required"),
  groupType: z.string().min(1, "Please select a group type"),
  hasCapacity: z.boolean().default(false),
  capacity: z.coerce.number().positive().optional(),
  isActive: z.boolean().default(true)
});

type StudySessionFormValues = z.infer<typeof studySessionSchema>;

// Extract date information from a session string
const parseDateString = (dateStr: string) => {
  let startDate: Date | undefined = undefined;
  let recurringDay: string | undefined = undefined;
  let isRecurring = false;
  
  // Match patterns like "Every Monday starting March 5"
  const recurringMatch = dateStr.match(/Every\s+(\w+)(?:\s+starting\s+(\w+\s+\d+))?/i);
  
  if (recurringMatch) {
    isRecurring = true;
    
    // Extract the day
    const day = recurringMatch[1]?.toLowerCase();
    if (day) {
      recurringDay = day;
    }
    
    // Extract the start date if present
    if (recurringMatch[2]) {
      try {
        // Try to parse the date - add current year as it's not in the string
        const currentYear = new Date().getFullYear();
        const dateWithYear = `${recurringMatch[2]}, ${currentYear}`;
        startDate = new Date(dateWithYear);
        
        // Check if the date is valid
        if (isNaN(startDate.getTime())) {
          startDate = undefined;
        }
      } catch (e) {
        startDate = undefined;
      }
    }
  } else {
    // Try to parse as a specific date
    try {
      const parsedDate = new Date(dateStr);
      
      // If valid date, use it as startDate
      if (!isNaN(parsedDate.getTime())) {
        startDate = parsedDate;
      }
    } catch (e) {
      // Parsing failed, leave startDate undefined
    }
  }
  
  return { startDate, recurringDay, isRecurring };
};

export default function Admin() {
  const { toast } = useToast();
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check authentication status on component mount and when login status changes
  const [checkCount, setCheckCount] = useState(0);
  
  // Force a re-check after successful login
  const recheckAuth = () => {
    setCheckCount(prev => prev + 1);
  };
  
  // Query for registrations - only run if authenticated
  const { data: registrations, isLoading: registrationsLoading, error: registrationsError, refetch: refetchRegistrations } = useQuery<Registration[]>({
    queryKey: ['/api/registrations'],
    refetchOnMount: true,
    staleTime: 10000, // 10 seconds
    enabled: isAuthenticated, // Only run query if authenticated
  });
  
  // Query for study sessions - public endpoint so doesn't need auth check
  const { data: studySessions, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery<StudySession[]>({
    queryKey: ['/api/study-sessions'],
    refetchOnMount: true,
    staleTime: 10000, // 10 seconds
  });

  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        console.log("Checking authentication status...");
        
        // Get all cookies to debug
        console.log("Current cookies:", document.cookie);
        
        // Make auth check request with explicit credentials inclusion
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Auth check response:", userData);
          // Only allow admin or super_admin roles
          if (userData && (userData.role === 'admin' || userData.role === 'super_admin')) {
            console.log("User is authenticated as admin");
            setIsAuthenticated(true);
            
            // The queries will auto-run when isAuthenticated changes
          } else {
            console.log("User is not an admin");
            setIsAuthenticated(false);
            toast({
              title: "Access denied",
              description: "You don't have administrator privileges",
              variant: "destructive"
            });
          }
        } else {
          console.log("Auth check failed with status:", response.status);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, [toast, checkCount]);
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // Study session form
  const sessionForm = useForm<StudySessionFormValues>({
    resolver: zodResolver(studySessionSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      address: "",
      startDate: undefined,
      recurringDay: undefined,
      isRecurring: true,
      date: "",
      time: "",
      groupType: "",
      hasCapacity: false,
      capacity: undefined,
      isActive: true
    }
  });
  
  // Create study session mutation
  const createSession = useMutation({
    mutationFn: (values: StudySessionFormValues) => {
      return apiRequest('POST', '/api/study-sessions', values);
    },
    onSuccess: () => {
      toast({
        title: "Study session created",
        description: "The new study session has been successfully created.",
        variant: "default"
      });
      setIsSessionDialogOpen(false);
      sessionForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create session",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  });
  
  // Update study session mutation
  const updateSession = useMutation({
    mutationFn: (data: { id: number; values: Partial<StudySessionFormValues> }) => {
      return apiRequest('PUT', `/api/study-sessions/${data.id}`, data.values);
    },
    onSuccess: () => {
      toast({
        title: "Study session updated",
        description: "The study session has been successfully updated.",
        variant: "default"
      });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
      sessionForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update session",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  });
  
  // Delete study session mutation
  const deleteSession = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/study-sessions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Study session deleted",
        description: "The study session has been successfully deleted.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete session",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  });
  
  // Toggle study session active status
  const toggleSessionStatus = useMutation({
    mutationFn: (data: { id: number; isActive: boolean }) => {
      return apiRequest('PUT', `/api/study-sessions/${data.id}`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  });

  // Format date information for display and submission
  const formatDateInfo = (values: StudySessionFormValues) => {
    let dateString = "";
    
    if (values.isRecurring && values.recurringDay) {
      // Format as "Every [Day]"
      dateString = `Every ${values.recurringDay}`;
      
      // Add start date if provided
      if (values.startDate) {
        const formattedDate = format(values.startDate, "MMMM d");
        dateString += ` starting ${formattedDate}`;
      }
    } else if (values.startDate) {
      // Format as specific date only
      dateString = format(values.startDate, "MMMM d, yyyy");
    } else {
      // Fallback to manually entered date
      dateString = values.date;
    }
    
    return dateString || values.date; // Return original date as fallback
  };

  // Handle session form submission
  const onSessionFormSubmit = (values: StudySessionFormValues) => {
    // If hasCapacity is false, ensure capacity is undefined
    const submissionValues = { 
      ...values,
      capacity: values.hasCapacity ? values.capacity : undefined,
      // Format the date field based on the selected options
      date: formatDateInfo(values)
    };
    
    if (editingSession) {
      updateSession.mutate({ id: editingSession.id, values: submissionValues });
    } else {
      createSession.mutate(submissionValues);
    }
  };
  
  // Open dialog for editing a session
  const handleEditSession = (session: StudySession) => {
    setEditingSession(session);
    
    // Parse date information from the date string
    const { startDate, recurringDay, isRecurring } = parseDateString(session.date);
    
    sessionForm.reset({
      title: session.title,
      description: session.description || "",
      location: session.location,
      address: session.address || "",
      startDate,
      recurringDay,
      isRecurring,
      date: session.date,
      time: session.time,
      groupType: session.groupType,
      hasCapacity: session.capacity !== null && session.capacity !== undefined,
      capacity: session.capacity || undefined,
      isActive: session.isActive === null ? true : session.isActive
    });
    setIsSessionDialogOpen(true);
  };
  
  // Open dialog for creating a new session
  const handleNewSession = () => {
    setEditingSession(null);
    sessionForm.reset({
      title: "",
      description: "",
      location: "",
      address: "",
      startDate: undefined,
      recurringDay: undefined,
      isRecurring: true, // Default to recurring sessions
      date: "",
      time: "",
      groupType: "",
      hasCapacity: false,
      capacity: undefined,
      isActive: true
    });
    setIsSessionDialogOpen(true);
  };
  
  // Helper for displaying registration contact status
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

  if (registrationsError || sessionsError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>Failed to load data: {((registrationsError || sessionsError) as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Helmet>
          <title>Loading Admin | Celebrate Recovery</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }
  
  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Helmet>
          <title>Admin Login | Celebrate Recovery</title>
        </Helmet>
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#374151]">Admin Dashboard</h1>
              <p className="text-[#6B7280]">Please log in to access the admin features</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
        
        <AdminLogin onLoginSuccess={() => recheckAuth()} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Helmet>
        <title>Admin Dashboard | Celebrate Recovery</title>
      </Helmet>
      
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#374151]">Admin Dashboard</h1>
            <p className="text-[#6B7280]">Manage step study registrations and scheduled sessions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Contact Information Card */}
      <Card className="mb-6 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#374151]">Primary Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-[#6B7280] mb-1">Program Coordinator</h3>
              <p className="text-[#374151]">John Smith</p>
              <p className="text-[#374151]">Program Director</p>
              <div className="mt-2 flex items-center gap-2 text-primary">
                <PhoneIcon className="h-4 w-4" />
                <a href="tel:(555) 123-4567" className="hover:underline">(555) 123-4567</a>
              </div>
              <div className="mt-1 flex items-center gap-2 text-primary">
                <MailIcon className="h-4 w-4" />
                <a href="mailto:john@celebraterecovery.org" className="hover:underline">john@celebraterecovery.org</a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#6B7280] mb-1">Meeting Location</h3>
              <p className="text-[#374151]">Celebrate Recovery Center</p>
              <p className="text-[#374151]">123 Main Street</p>
              <p className="text-[#374151]">Springfield, IL 62701</p>
              <div className="mt-2 flex items-center gap-2 text-primary">
                <ExternalLinkIcon className="h-4 w-4" />
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Get Directions</a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
        </TabsList>
        
        {/* Registrations Tab */}
        <TabsContent value="registrations">
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
                    onClick={() => refetchRegistrations()}
                    className="flex items-center gap-1"
                    disabled={registrationsLoading}
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
              {registrationsLoading ? (
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
                        <TableHead>Scheduling</TableHead>
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
                              <div>
                                <Badge className="mb-2">
                                  {registration.flexibilityOption === 'preferred_session' && 'Scheduled Session'}
                                  {registration.flexibilityOption === 'flexible_schedule' && 'Flexible Schedule'}
                                  {registration.flexibilityOption === 'either' && 'Either Option'}
                                </Badge>
                                
                                {registration.sessionId ? (
                                  <div className="text-sm">
                                    <span className="font-medium">Selected Session ID:</span> {registration.sessionId}
                                  </div>
                                ) : (
                                  <>
                                    {Array.isArray(registration.availableDays) && registration.availableDays.length > 0 && (
                                      <div className="text-sm">
                                        <span className="font-medium">Days:</span> {registration.availableDays.join(', ')}
                                      </div>
                                    )}
                                    {Array.isArray(registration.availableTimes) && registration.availableTimes.length > 0 && (
                                      <div className="text-sm">
                                        <span className="font-medium">Times:</span> {registration.availableTimes.join(', ')}
                                      </div>
                                    )}
                                  </>
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
        </TabsContent>
        
        {/* Study Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold text-[#374151]">
                    Study Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage scheduled step study sessions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchSessions()}
                    className="flex items-center gap-1"
                    disabled={sessionsLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </Button>
                  <Button
                    onClick={handleNewSession}
                    className="bg-primary hover:bg-blue-600 text-white"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    <span>New Session</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {studySessions && studySessions.length > 0 ? (
                    studySessions.map((session) => (
                      <div 
                        key={session.id} 
                        className={`border rounded-lg p-4 ${
                          session.isActive 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-[#374151]">{session.title}</h3>
                              <Badge variant={session.isActive ? "default" : "outline"} 
                                     className={session.isActive ? "bg-green-100 text-green-800 hover:bg-green-200 border-transparent" : ""}>
                                {session.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            {session.description && (
                              <p className="text-[#6B7280]">{session.description}</p>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                <CalendarIcon className="h-4 w-4 text-[#9CA3AF]" />
                                <span>{session.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                <ClockIcon className="h-4 w-4 text-[#9CA3AF]" />
                                <span>{session.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                <MapPinIcon className="h-4 w-4 text-[#9CA3AF]" />
                                <span>{session.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                <UserIcon className="h-4 w-4 text-[#9CA3AF]" />
                                <span>
                                  {session.groupType === 'men' && 'Men\'s Group'}
                                  {session.groupType === 'women' && 'Women\'s Group'}
                                </span>
                              </div>
                              {session.capacity !== null && session.capacity !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                  <UsersIcon className="h-4 w-4 text-[#9CA3AF]" />
                                  <span>Capacity: {session.capacity}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                <span className="text-[#9CA3AF]">ID:</span>
                                <span>{session.id}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex md:flex-col gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9"
                              onClick={() => handleEditSession(session)}
                            >
                              <EditIcon className="h-4 w-4 mr-1" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant={session.isActive ? "outline" : "default"}
                              size="sm"
                              className={`h-9 ${
                                session.isActive 
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              onClick={() => toggleSessionStatus.mutate({ 
                                id: session.id, 
                                isActive: !session.isActive 
                              })}
                            >
                              {session.isActive ? (
                                <>
                                  <ToggleLeftIcon className="h-4 w-4 mr-1" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <ToggleRightIcon className="h-4 w-4 mr-1" />
                                  <span>Activate</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-9"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
                                  deleteSession.mutate(session.id);
                                }
                              }}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                      <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <CalendarIcon className="h-10 w-10 text-[#9CA3AF]" />
                      </div>
                      <h3 className="text-lg font-medium text-[#374151] mb-1">No Study Sessions</h3>
                      <p className="text-[#6B7280] mb-4">No study sessions have been created yet.</p>
                      <Button
                        onClick={handleNewSession}
                        className="bg-primary hover:bg-blue-600 text-white"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        <span>Create Your First Session</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Study Session Form Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">{editingSession ? "Edit Study Session" : "Create New Study Session"}</DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280] mt-1">
              {editingSession ? "Update the details of this study session" : "Fill in the details to create a new study session."}
            </DialogDescription>
          </DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(onSessionFormSubmit)} className="space-y-5">
              <FormField
                control={sessionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Step Study Session" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of this study session" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Church Fellowship Hall - Room 101" {...field} />
                    </FormControl>
                    <FormDescription>
                      General location (e.g., building name or room number)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street, Springfield, IL 62701" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full address information for directions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Recurring vs. One-time toggle */}
              <FormField
                control={sessionForm.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <RepeatIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <FormLabel>Recurring Schedule</FormLabel>
                      </div>
                      <FormDescription>
                        Session repeats weekly on the selected day
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Day selection (for recurring sessions) */}
              {sessionForm.watch("isRecurring") && (
                <FormField
                  control={sessionForm.control}
                  name="recurringDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <FormControl>
                        <DaySelector 
                          selected={field.value as DayOfWeek} 
                          onSelect={(day) => field.onChange(day)}
                          className="pt-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Date picker */}
              <FormField
                control={sessionForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {sessionForm.watch("isRecurring") 
                        ? "Starting Date" 
                        : "Session Date"}
                    </FormLabel>
                    <FormControl>
                      <InputDatePicker 
                        date={field.value} 
                        onSelect={field.onChange}
                        placeholder={sessionForm.watch("isRecurring")
                          ? "Select first session date" 
                          : "Select session date"}
                      />
                    </FormControl>
                    <FormDescription>
                      {sessionForm.watch("isRecurring")
                        ? "The date of the first session in this recurring series"
                        : "The specific date for this one-time session"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Legacy date field as fallback and for display */}
              <FormField
                control={sessionForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Display (Auto-generated)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={sessionForm.watch("isRecurring")
                          ? "Every Tuesday starting March 5"
                          : "March 5, 2024"}
                        {...field} 
                        value={formatDateInfo({
                          ...sessionForm.getValues(),
                          date: field.value
                        })}
                        onChange={(e) => {
                          if (!sessionForm.watch("startDate") && !sessionForm.watch("recurringDay")) {
                            field.onChange(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This is how the date will appear to users. Edit manually only if needed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input placeholder="7:00 PM - 8:30 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="groupType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="men">Men's Group</SelectItem>
                        <SelectItem value="women">Women's Group</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="hasCapacity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Limit Capacity</FormLabel>
                      <FormDescription>
                        Set a maximum number of participants for this session
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {sessionForm.watch("hasCapacity") && (
                <FormField
                  control={sessionForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="12" 
                          type="number" 
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={sessionForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Make this session available for registration
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsSessionDialogOpen(false)}
                  className="mt-3 sm:mt-0 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-blue-600 text-white w-full sm:w-auto"
                  disabled={createSession.isPending || updateSession.isPending}
                >
                  {createSession.isPending || updateSession.isPending ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editingSession ? "Update Session" : "Create Session"}</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
