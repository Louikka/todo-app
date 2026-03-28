import { DBDeleteEntry, DBGetEntries, DBSetEntry } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';


// initial data retrievement
_DBGetEntries().then((data) =>
{
    for (let i = 0; i < data.length; i++)
    {
        setTimeout(() =>
        {
            createToDoEntryElement(data[i]);
        }, 25 * i);
    }
});


const headerInputEventHandler = async () =>
{
    const DB_data = await _DBGetEntries();


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

    _DBSetEntry(d.id, d.text);
    createToDoEntryElement(d);
};

document.querySelector<HTMLInputElement>('.header .input > .input-field > input')!
    .addEventListener('keydown', (ev) =>
{
    if (ev.key === 'Enter')
    {
        headerInputEventHandler();
    }
});
document.querySelector<HTMLInputElement>('.header .input > .input-submit > input')!
    .addEventListener('click', headerInputEventHandler)
;



/* Helpers *******************************************************************/

/**
 * Wrapper over `DBGetEntries()` function with error handling.
 * The Promise will never reject.
 */
async function _DBGetEntries(): Promise<main.ToDoEntry[]>
{
    let d: main.ToDoEntry[] = [];

    try
    {
        d = await DBGetEntries();
    }
    catch (err)
    {
        console.log(err);
    }

    return d;
}
/** Wrapper over `DBSetEntry()` function with error handling. */
function _DBSetEntry(id: number, text: string)
{
    try
    {
        DBSetEntry(id, text);
    }
    catch (err)
    {
        console.log(err);
    }
}
/** Wrapper over `DBDeleteEntry()` function with error handling. */
function _DBDeleteEntry(id: number)
{
    try
    {
        DBDeleteEntry(id);
    }
    catch (err)
    {
        console.log(err);
    }
}

function createToDoEntryElement(data: main.ToDoEntry)
{
    const t = document.getElementById('todo-entry')! as HTMLTemplateElement;
    const e = t.content.cloneNode(true) as DocumentFragment;

    e.querySelector('.todo-entry')!.setAttribute('data-id', (data.id).toString());

    e.querySelector('.text')!.textContent = data.text;

    e.querySelector('.buttons > button.delete')!.addEventListener('click', () =>
    {
        _DBDeleteEntry(data.id);
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
