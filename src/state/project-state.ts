import {Project, ProjectStatus} from '../models/project-models.js';


//Project State Manager
type Listner<T> = (items: T[]) => void;

class State<T> {
    protected listeners: Listner<T>[] = [];
    addListeners(listenerFn: Listner<T>) {
        this.listeners.push(listenerFn)
    }

}

export class ProjectState extends State<Project> {

    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super()

    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }


    addProject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numOfPeople,
            ProjectStatus.Active
        )
        this.projects.push(newProject)
        this.updateListeners();

    }
    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find(proj => proj.id === projectId)
        if (project && project.status !== newStatus) {
            project.status = newStatus;
            this.updateListeners()
        }
    }

    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

export const projectState = ProjectState.getInstance();
