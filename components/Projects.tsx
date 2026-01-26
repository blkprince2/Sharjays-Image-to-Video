
import React from 'react';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const Projects: React.FC<ProjectsProps> = ({ projects, setProjects }) => {
  const createProject = () => {
    const name = prompt("Project Name:");
    if (!name) return;
    const newProj: Project = {
      id: `p_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 0,
      videoCount: 0
    };
    setProjects(prev => [newProj, ...prev]);
  };

  const deleteProject = (id: string) => {
    if (confirm("Are you sure?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6 shadow-2xl animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#D4AF37]">Managed Projects</h2>
        <button 
          onClick={createProject}
          className="bg-[#D4AF37] text-black font-bold py-2 px-6 rounded-lg hover:brightness-110 transition"
        >
          <i className="fas fa-plus mr-2"></i> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gold/20 rounded-xl">
           <i className="fas fa-folder-open text-6xl text-gold/20 mb-4"></i>
           <p className="text-gold/40">No projects found. Create one to organize your renders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {projects.map(proj => (
             <div key={proj.id} className="bg-[#1A1A1A]/50 border border-gold/20 p-6 rounded-xl hover:border-gold/60 transition group">
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <h4 className="text-[#D4AF37] font-bold text-lg">{proj.name}</h4>
                     <p className="text-xs text-white/40">Created {new Date(proj.createdAt).toLocaleDateString()}</p>
                   </div>
                   <button onClick={() => deleteProject(proj.id)} className="text-red-500/50 hover:text-red-500">
                     <i className="fas fa-trash-alt"></i>
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                   <div className="text-center p-2 bg-black/30 rounded">
                      <p className="text-xl font-bold text-white">{proj.imageCount}</p>
                      <p className="text-[10px] text-gold/60 uppercase">Images</p>
                   </div>
                   <div className="text-center p-2 bg-black/30 rounded">
                      <p className="text-xl font-bold text-white">{proj.videoCount}</p>
                      <p className="text-[10px] text-gold/60 uppercase">Videos</p>
                   </div>
                </div>
                <button className="w-full mt-6 py-2 border border-gold/30 text-gold text-sm rounded hover:bg-gold/10 transition">
                  Open Workspace
                </button>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
