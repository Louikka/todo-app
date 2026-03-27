import { DBDeleteEntry, DBGetEntries, DBSetEntry } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';


// initial data retrievement

const DB_data = await DBGetEntries().catch((err) =>
{
    console.error(err);
    return [] as main.ToDoEntry[];
});

for (let i = 0; i < DB_data.length; i++)
{
    setTimeout(() =>
    {
        createToDoEntryElement(DB_data[i]);
    }, 25 * i);
}


document.querySelector<HTMLInputElement>('.header .input > .input-submit > input')!
    .addEventListener('click', async (ev) =>
{
    ev.preventDefault();

    const DB_data = await DBGetEntries().catch((err) =>
    {
        console.error(err);
        return [] as main.ToDoEntry[];
    });


    /* Retrieve data. */

    const eHeaderInputField = document.querySelector('.header .input > .input-field > input')! as HTMLInputElement;

    const _text = eHeaderInputField.value.trim();
    eHeaderInputField.value = '';

    if (_text.length === 0) return;

    let _id = 0;
    while (DB_data.some((o) => o.id === _id)) _id++;


    /* Assembly entry object. */

    const d: main.ToDoEntry = {
        id : _id,
        text : _text,
    };

    DBSetEntry(d.id, d.text).catch((err) =>
    {
        console.error(err);
    });

    createToDoEntryElement(d);
});



/* Helpers *******************************************************************/

function createToDoEntryElement(data: main.ToDoEntry)
{
    const t = document.getElementById('todo-entry')! as HTMLTemplateElement;
    const e = t.content.cloneNode(true) as DocumentFragment;

    e.querySelector('.todo-entry')!.setAttribute('data-id', (data.id).toString());

    e.querySelector('.text')!.textContent = data.text;

    e.querySelector('.buttons > button.delete')!.addEventListener('click', () =>
    {
        DBDeleteEntry(data.id).catch((err) =>
        {
            console.error(err);
        });

        deleteToDoEntryElement(data.id);
    });

    document.querySelector('.main > .todo-entries')!.append(e);
}

function deleteToDoEntryElement(id: number)
{
    const e = document.querySelector(`.main > .todo-entries > .todo-entry[data-id="${id}"]`);
    if (e === null)
    {
        console.error(`Cannot find ToDo entry element with id=${id}.`);
    }
    else
    {
        e.remove();
    }
}
