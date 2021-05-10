import Component from './base-component';
import * as Validation from '../util/project-validation';
import { autobind as Autobind } from '../decorators/autobind-decorator';
import { projectState } from '../state/project-state';

//project input class


export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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

        const titleValidatable: Validation.IValidatable = {
            value: enteredTitle,
            required: true
        };
        const descriptionValidatable: Validation.IValidatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };
        const peopleValidatable: Validation.IValidatable = {
            value: +enteredPeople,
            required: true,
            minLength: 1,
            maxLength: 5

        };

        if (
            !Validation.validate(titleValidatable) ||
            !Validation.validate(descriptionValidatable) ||
            !Validation.validate(peopleValidatable)
        ) {
            alert('invalid input, try again')
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople]
        }
    }

    @Autobind
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
