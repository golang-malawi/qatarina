import { ReactGrid, Cell, Row, Column } from "@silevis/reactgrid";
import { TextCell } from "@silevis/reactgrid";
import { useState } from "react";

export default function TestCaseGrid() {
  interface TestCaseTest {
    id: string;
    project_id: string;
    created_by_id: string;
    kind: string;
    code: string;
    featureormodule: string;
    title: string;
    description: string;
    is_draft: boolean;
    tags: string[];
  }

  const getPeople = (): TestCaseTest[] => [];

  const [people] = useState<TestCaseTest[]>(getPeople());

  // Define rows
  const rows: Row[] = [
    { rowIndex: 0, height: 50 }, // Header row
    ...people.map((_, index) => ({ rowIndex: index + 1, height: 50 })),
  ];

  // Define columns
  const columns: Column[] = [
    { colIndex: 0, width: 100 },
    { colIndex: 1, width: 200 },
    { colIndex: 2, width: 300 },
    { colIndex: 3, width: 150 },
    { colIndex: 4, width: 150 },
    { colIndex: 5, width: 150 },
  ];

  // Define cells
  const cells: Cell[] = [
    // Header cells
    {
      rowIndex: 0,
      colIndex: 0,
      Template: TextCell,
      props: { text: "Code", onTextChanged: () => {} },
    },
    {
      rowIndex: 0,
      colIndex: 1,
      Template: TextCell,
      props: { text: "Title", onTextChanged: () => {} },
    },
    {
      rowIndex: 0,
      colIndex: 2,
      Template: TextCell,
      props: { text: "Description", onTextChanged: () => {} },
    },
    {
      rowIndex: 0,
      colIndex: 3,
      Template: TextCell,
      props: { text: "Tags", onTextChanged: () => {} },
    },
    {
      rowIndex: 0,
      colIndex: 4,
      Template: TextCell,
      props: { text: "Testers", onTextChanged: () => {} },
    },
    {
      rowIndex: 0,
      colIndex: 5,
      Template: TextCell,
      props: { text: "Created At", onTextChanged: () => {} },
    },
    // Data cells
    ...people.flatMap((person, rowIndex) => [
      {
        rowIndex: rowIndex + 1,
        colIndex: 0,
        Template: TextCell,
        props: { text: person.code || "", onTextChanged: () => {} },
      },
      {
        rowIndex: rowIndex + 1,
        colIndex: 1,
        Template: TextCell,
        props: { text: person.title || "", onTextChanged: () => {} },
      },
      {
        rowIndex: rowIndex + 1,
        colIndex: 2,
        Template: TextCell,
        props: { text: person.description || "", onTextChanged: () => {} },
      },
      {
        rowIndex: rowIndex + 1,
        colIndex: 3,
        Template: TextCell,
        props: { text: person.tags?.join(", ") || "", onTextChanged: () => {} },
      },
      {
        rowIndex: rowIndex + 1,
        colIndex: 4,
        Template: TextCell,
        props: { text: "", onTextChanged: () => {} },
      },
      {
        rowIndex: rowIndex + 1,
        colIndex: 5,
        Template: TextCell,
        props: { text: "", onTextChanged: () => {} },
      },
    ]),
  ];

  return (
    <ReactGrid
      rows={rows}
      columns={columns}
      cells={cells}
      stickyTopRows={1}
      stickyLeftColumns={1}
    />
  );
}
