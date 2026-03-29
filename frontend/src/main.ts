import { scan, startWith, Subject } from 'rxjs';
import { DBDeleteEntry, DBGetEntries, DBSetEntry } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';


/* Initialization ************************************************************/

interface _SubjectAction {
    type: 'INIT' | 'ADD' | 'DELETE';
    entry: main.ToDoEntry | null;
}

const ToDoEntriesSubject$ = new Subject<_SubjectAction>();

const ToDoEntries$ = ToDoEntriesSubject$.pipe(
    startWith<_SubjectAction>({ type : 'INIT', entry : null, }),
    scan<_SubjectAction, main.ToDoEntry[], main.ToDoEntry[]>((entries, action) =>
    {
        if (action.entry === null) return entries;

        switch (action.type)
        {
            case 'ADD':
            {
                return [ ...entries, action.entry, ];
            }
            case 'DELETE':
            {
                return entries.filter((o) =>
                {
                    if (action.entry !== null)
                    {
                        return o.id !== action.entry.id;
                    }

                    return false;
                });
            }

            default:
            {
                return entries;
            }
        }
    }, []),
);

/** Sends `ADD` action to {@link ToDoEntriesSubject$} Subject. */
const AddNewEntry$ = (data: main.ToDoEntry) =>
{
    ToDoEntriesSubject$.next({
        type : 'ADD',
        entry : data,
    });
};
const AddNewEntry = (data: main.ToDoEntry) =>
{
    _DBSetEntry(data.id, data.text);
    AddNewEntry$(data);
};

/** Sends `DELETE` action to {@link ToDoEntriesSubject$} Subject. */
const DeleteEntry$ = (id: number) =>
{
    ToDoEntriesSubject$.next({
        type : 'DELETE',
        entry : {
            id,
            text : '',
        },
    });
};
const DeleteEntry = (id: number) =>
{
    _DBDeleteEntry(id);
    DeleteEntry$(id);
};


/* App logic *****************************************************************/

ToDoEntries$.subscribe((v) =>
{
    const container = document.querySelector('.main > .todo-entries')!;

    // here stored only IDs that already displayed
    const _presentEntries: number[] = [];
    container.querySelectorAll('.todo-entry[data-id]').forEach((e) =>
    {
        const id = +(e.getAttribute('data-id') ?? 0);

        if (v.some((o => o.id === id)))
        {
            _presentEntries.push(id);
        }
    });

    // append new entry elements
    for (const data of v)
    {
        const _i = _presentEntries.indexOf(data.id);
        if (_i > -1)
        {
            _presentEntries.splice(_i, 1);
            continue;
        }

        appendToDoEntryElement(data, () =>
        {
            DeleteEntry(data.id);
        });
    }

    // cleanup deleted entry elements
    if (_presentEntries.length > 0)
    {
        for (const id of _presentEntries)
        {
            deleteToDoEntryElement(id);
        }
    }
});



// initial data retrievement
_DBGetEntries().then((data) =>
{
    for (let i = 0; i < data.length; i++)
    {
        setTimeout(() =>
        {
            AddNewEntry$(data[i]);
        }, 25 * i);
    }
});


const headerInputEventHandler = async () =>
{
    const eHeaderInputField = document.querySelector('.header .input > .input-field > input')! as HTMLInputElement;

    const _text = eHeaderInputField.value.trim();
    eHeaderInputField.value = '';

    if (_text.length === 0) return;

    const d: main.ToDoEntry = {
        id : Date.now(),
        text : _text,
    };

    AddNewEntry(d);
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

/**
 * @param onDelete function that will run on element deletion, before deleting db entry and element.
 */
function appendToDoEntryElement(data: main.ToDoEntry, onDelete?: () => void)
{
    const t = document.getElementById('todo-entry')! as HTMLTemplateElement;
    const e = t.content.cloneNode(true) as DocumentFragment;

    e.querySelector('.todo-entry')!.setAttribute('data-id', (data.id).toString());

    e.querySelector('.text')!.textContent = data.text;

    e.querySelector('.button.delete > button')!.addEventListener('click', () =>
    {
        (onDelete ?? (() => {}))();
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
