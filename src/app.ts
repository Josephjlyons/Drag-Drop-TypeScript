//Drag and Drop Interface
interface IDraggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void
}

interface IDragTarget {
    dragOverHandler(event: DragEvent): void
    dropHandler(event: DragEvent): void
    dragLeaveHandler(event: DragEvent): void
}

//Project Type
enum ProjectStatus {
    Active,
    Finished
}

class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus

    ) { }

}

//Project State Manager

type Listner<T> = (items: T[]) => void;


class State<T> {
    protected listeners: Listner<T>[] = [];
    addListeners(listenerFn: Listner<T>) {
        this.listeners.push(listenerFn)
    }

}

class ProjectState extends State<Project> {

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
        if(project && project.status !==newStatus) {
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

const projectState = ProjectState.getInstance();

//validation logic decorator

interface IValidatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: IValidatable) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null &&
        typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null &&
        typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}


// autobind Decorator

function autobind(
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor;
}

//Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement>{
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId?: string,
    ) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart);
    }
    private attach(insertAtBeginning: boolean) {
        this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void;
    abstract renderContent(): void
}

//Project Item  Class

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements IDraggable {
    private project: Project;

    get persons() {
        if (this.project.people === 1) {
            return '1 person';
        } else {
            return `${this.project.people} persons`
        }
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure();
        this.renderContent()
    }
    @autobind
    dragStartHandler(event: DragEvent) {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    dragEndHandler(_: DragEvent) {
        console.log('DragEnd')
    }


    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler)
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent() {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }

}


//Project list Class

class ProjectList extends Component<HTMLDivElement, HTMLElement> implements IDragTarget {

    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }


    @autobind
    dragOverHandler(event: DragEvent) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEl = this.element.querySelector('ul')!
            listEl.classList.add('droppable');

        }
    }
    @autobind
    dropHandler(event: DragEvent) {
        const projId = event.dataTransfer!.getData('text/plain');
        projectState.moveProject(projId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished )
    }

    @autobind
    dragLeaveHandler(event: DragEvent) {

        const listEl = this.element.querySelector('ul')!
        listEl.classList.remove('droppable');

    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListeners((projects: Project[]) => {
            const relevantProjects = projects.filter(proj => {
                if (this.type === 'active') {
                    return proj.status === ProjectStatus.Active
                }
                return proj.status === ProjectStatus.Finished;
            });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' Projects'
    }
       private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML = '';
        for (const projItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul')!.id, projItem)
        }
    }
}


//project input class

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputEl: HTMLInputElement;
    descriptionInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input');
        this.titleInputEl = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputEl = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputEl = this.element.querySelector('#people') as HTMLInputElement;

        this.configure()
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputEl.value;
        const enteredDescription = this.descriptionInputEl.value;
        const enteredPeople = this.peopleInputEl.value;

        const titleValidatable: IValidatable = {
            value: enteredTitle,
            required: true
        };
        const descriptionValidatable: IValidatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };
        const peopleValidatable: IValidatable = {
            value: +enteredPeople,
            required: true,
            minLength: 1,
            maxLength: 5

        };

        if (
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
        ) {
            alert('invalid input, try again')
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople]
        }
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            projectState.addProject(title, description, people)
            this.clearInputs();
        }
    }

    configure() {

        this.element.addEventListener('submit', this.submitHandler)
    }

    renderContent() { };

    private clearInputs() {
        this.titleInputEl.value = '';
        this.descriptionInputEl.value = '';
        this.peopleInputEl.value = '';
    }


}

const projInput = new ProjectInput();
const activeProjList = new ProjectList('active');
const finishedProjList = new ProjectList('finished');
