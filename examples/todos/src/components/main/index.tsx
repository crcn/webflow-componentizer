import * as React from "react";
import {BaseApplication as BaseApplicationComponent, BaseTodoItem as BaseTodoItemComponent} from "../../views/stable/sprite.html";


type TodoItem = {
  label: string;
  completed?: boolean;
};

type State = {
  newInputValue: string;
  todoItems: TodoItem[];
}

type TodoItemComponentProps = {
  item: TodoItem;
}

class TodoItemComponent extends React.Component<TodoItemComponentProps> {
  render() {
    const {item:{label}} = this.props;
    return <BaseTodoItemComponent label={label} />;
  }
};

export class Application extends React.Component<any, State> {
  _newTodoInput: HTMLInputElement;

  state = {
    newInputValue: null,
    todoItems: []
  };

  onNewTodoInputChange = (event: React.KeyboardEvent<any>) => {
    this.setState({ ...this.state, newInputValue: (event.target as any).value });
  }

  onSubmit = (event) => {
    event.preventDefault();
    if (this.state.newInputValue) {
      this.setState({
        newInputValue: null,
        todoItems: [...this.state.todoItems, { label: this.state.newInputValue }]
      });
      this._newTodoInput.value = "";
    }
  }
  setNewTodoInput = (ref) => {
    this._newTodoInput = ref;
  }

  render() {
    const {onNewTodoInputChange, onSubmit, setNewTodoInput} = this;
    const {todoItems} = this.state;

    const todoItemComponents = todoItems.map((item, i) => {
      return <TodoItemComponent item={item} key={i} />;
    });

    return <BaseApplicationComponent newTodoButtonProps={null} todoFormProps={{
      onSubmit
    } as any} todoItems={todoItemComponents} newTodoInputProps={{
      onChange: onNewTodoInputChange,
      ref: setNewTodoInput
    }} />;
  }
}