import { IAdminUserStat } from "@models/App.ts";
import ky from "ky";
import { capitalize, xor } from "lodash";
import { useState } from "preact/hooks";

/** Component displaying the recovery key and allowing to copy it to clipboard or download it as a file. */
export default function UserTable({ users }: { users: IAdminUserStat[] }) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const deleteElement = async (e: MouseEvent, type: "users" | "content" | "entries", id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || !confirm("Are you sure to delete this element ? This action is IRREVERSIBLE!")) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const isDeleted = await ky.delete(`/api/${type}/${id}`, { retry: 0 }).then((res) => res?.ok).catch((e) => {
      console.error(e);
      return false;
    });

    if (isDeleted) {
      alert("Element has been successfully deleted.");
      globalThis.location.reload();
    } else {
      alert("An unexpected error occured and the user could not be deleted. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col w-full max-w-full" style={{ pointerEvents: loading ? "none" : "auto" }}>
      {users.map(({ user, content, entries }, index) => (
        <>
          <div className="flex gap-4 items-center" onClick={() => setOpenIndexes((p) => xor(p, [index]))}>
            <div class="w-4">{index + 1}</div>
            <div class="grow shrink">{user}</div>
            <button type="button" class="btn btn-error h-fit shrink-0" onClick={(e) => deleteElement(e, "users", user)}>
              Delete
            </button>
          </div>
          <div
            class="overflow-x-auto max-h-[200px] grow transition-all h-[400px]"
            style={openIndexes.includes(index)
              ? { maxHeight: "400px", overflowY: "visible" }
              : { maxHeight: "0", overflowY: "hidden" }}
          >
            <table class="table-xs table-pin-rows w-full max-w-full">
              <SubTable type="content" datas={content} onClick={(e, t, id) => deleteElement(e, t, `${user};;${id}`)} />
              <SubTable type="entries" datas={entries} onClick={(e, t, id) => deleteElement(e, t, `${user};;${id}`)} />
            </table>
          </div>
        </>
      ))}
    </div>
  );
}

const SubTable = (
  { type, datas, onClick }: {
    type: "content" | "entries";
    datas: string[];
    onClick: (e: MouseEvent, type: "content" | "entries", value: string) => void;
  },
) => (
  <>
    <thead>
      <tr>
        <th>{capitalize(type)}</th>
        <th>ID</th>
        <th class="max-w-20">{/* Delete */}</th>
      </tr>
    </thead>
    <tbody>
      {datas.map((dataId, index) => (
        <tr className="bg-base-200">
          <td>{index + 1}</td>
          <td>{dataId}</td>
          <td class="max-w-20">
            <button type="button" class="btn btn-error h-fit" onClick={(e) => onClick(e, type, dataId)}>
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </>
);
