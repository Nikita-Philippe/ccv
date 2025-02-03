import { TField } from "@models/Content.ts";

type Props = {
  field: TField;
};

export default function String({ field }: Props) {
  return (
    <input
      type="text"
      class="block w-full px-3 py-2 mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    >
    </input>
  );
}
