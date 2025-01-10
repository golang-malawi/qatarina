import { Column, ReactGrid, Row } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
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

  const getColumns = (): Column[] => [
    { columnId: "code" },
    { columnId: "title" },
    { columnId: "description" },
    { columnId: "tags" },
    { columnId: "testers" },
    { columnId: "created_at" },
  ];

  const headerRow: Row = {
    rowId: "header",
    cells: [
      { type: "header", text: "Name" },
      { type: "header", text: "Surname" },
      { type: "header", text: "code" },
      { type: "header", text: "title" },
      { type: "header", text: "description" },
      { type: "header", text: "tags" },
      { type: "header", text: "testers" },
      { type: "header", text: "created_at" },
    ],
  };

  const getRows = (people: TestCaseTest[]): Row[] => [
    headerRow,
    ...people.map<Row>((tc, idx) => ({
      rowId: idx,
      cells: [
        { type: "text", text: "Name" },
        { type: "text", text: "Surname" },
        { type: "text", text: "code" },
        { type: "text", text: "title" },
        { type: "text", text: "description" },
        { type: "text", text: "tags" },
        { type: "text", text: "testers" },
        { type: "text", text: "created_at" },
      ],
    })),
  ];
  const [people] = useState<TestCaseTest[]>(getPeople());

  const rows = getRows(people);
  const columns = getColumns();

  return <ReactGrid rows={rows} columns={columns} />;
}
