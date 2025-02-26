import { useState } from "react";
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
  ExternalLinkIcon
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

// Form schemas for study session management
const studySessionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().min(3, "Location is required"),
  date: z.string().min(3, "Date information is required"),
  time: z.string().min(3, "Time information is required"),
  groupType: z.string().min(1, "Please select a group type"),
  capacity: z.coerce.number().positive().optional(),
  isActive: z.boolean().default(true)
});

type StudySessionFormValues = z.infer<typeof studySessionSchema>;

export default function Admin() {
  const { toast } = useToast();
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  
  // Query for registrations
  const { data: registrations, isLoading: registrationsLoading, error: registrationsError, refetch: refetchRegistrations } = useQuery<Registration[]>({
    queryKey: ['/api/registrations'],
    refetchOnMount: true,
    staleTime: 10000, // 10 seconds
  });
  
  // Query for study sessions
  const { data: studySessions, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery<StudySession[]>({
    queryKey: ['/api/study-sessions'],
    refetchOnMount: true,
    staleTime: 10000, // 10 seconds
  });
  
  // Study session form
  const sessionForm = useForm<StudySessionFormValues>({
    resolver: zodResolver(studySessionSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      groupType: "",
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

  // Handle session form submission
  const onSessionFormSubmit = (values: StudySessionFormValues) => {
    if (editingSession) {
      updateSession.mutate({ id: editingSession.id, values });
    } else {
      createSession.mutate(values);
    }
  };
  
  // Open dialog for editing a session
  const handleEditSession = (session: StudySession) => {
    setEditingSession(session);
    sessionForm.reset({
      title: session.title,
      description: session.description || "",
      location: session.location,
      date: session.date,
      time: session.time,
      groupType: session.groupType,
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
      date: "",
      time: "",
      groupType: "",
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
                              {session.capacity && (
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit Study Session" : "Create New Study Session"}</DialogTitle>
            <DialogDescription>
              {editingSession ? "Update the details of this study session" : "Fill in the details to create a new study session."}
            </DialogDescription>
          </DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(onSessionFormSubmit)} className="space-y-4">
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Church Fellowship Hall - Room 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={sessionForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date / Schedule</FormLabel>
                      <FormControl>
                        <Input placeholder="Every Tuesday starting March 5" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use format like "Every Tuesday" or specific dates
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Optional)</FormLabel>
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
              </div>
              
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
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsSessionDialogOpen(false)}
                  className="mt-4"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-blue-600 text-white mt-4"
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
