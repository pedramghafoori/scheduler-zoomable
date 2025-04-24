import Layout from "@/components/Layout";
import CourseBank from "@/components/CourseBank";
import ScheduleGrid from "@/components/ScheduleGrid";
import AddPoolModal from "@/components/AddPoolModal";

const Index = () => {
  return (
    <Layout>
      <CourseBank />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white p-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">Schedule</h2>
          <AddPoolModal />
        </div>
        <div className="flex-1 overflow-auto">
          <ScheduleGrid />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
