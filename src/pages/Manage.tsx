import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useScheduleStore } from "@/stores/scheduleStore";
import EditCourseDialog from "@/components/EditCourseDialog";
import { Course } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

const Manage = () => {
  const { pools, courses, updateCourse, removeCourse } = useScheduleStore();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm("Are you sure you want to delete this course? This will also remove all scheduled sessions for this course.")) {
      removeCourse(courseId);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pools.map((pool) => (
                  <div key={pool.id} className="border p-4 rounded-md">
                    <h3 className="font-bold">{pool.title}</h3>
                    <p className="text-sm text-gray-500">{pool.location}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pool.days.map((day) => (
                        <span
                          key={day.id}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {day.day}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                
                {pools.length === 0 && (
                  <p className="text-gray-500 italic">No pools created yet</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                Pool management will be expanded in future updates
              </p>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="border p-4 rounded-md flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: course.color }}
                      ></div>
                      <div>
                        <h3 className="font-bold">{course.name}</h3>
                        <p className="text-sm text-gray-500">
                          {course.totalHours} hours total
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCourse(course)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCourse(course.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {courses.length === 0 && (
                  <p className="text-gray-500 italic">No courses created yet</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                Add new courses from the Scheduler page
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h2 className="text-lg font-bold mb-2">Admin Panel - Coming Soon</h2>
          <p className="text-gray-600">
            Full CRUD functionality for Pools and Courses will be implemented in future updates.
            For now, you can add new pools and courses from the Scheduler page.
          </p>
        </div>
      </div>

      <EditCourseDialog
        course={editingCourse}
        open={editingCourse !== null}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        onSave={updateCourse}
      />
    </Layout>
  );
};

export default Manage;
