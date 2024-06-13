"use client";
import { useState } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the grid
import { Avatar, AvatarGroup } from '@chakra-ui/react';

export default function GridPage() {

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([
    { title: 'Testing User interface', testers: ['x', 'y', 'z'], updatedAt: new Date(), categories: ['module-A'] },
    { title: 'Testing User interface', testers: ['x', 'y', 'z'], updatedAt: new Date(), categories: ['module-B'] },
    { title: 'Testing User interface', testers: ['x', 'y', 'z'], updatedAt: new Date(), categories: ['module-C'] },
    { title: 'Testing User interface', testers: ['x', 'y', 'z'], updatedAt: new Date(), categories: ['module-D'] },
    { title: 'Testing User interface', testers: ['x', 'y', 'z'], updatedAt: new Date(), categories: ['module-E'] },
  ]);

  const TestersCell = (props) => {
    return (<AvatarGroup size='md' max={2}>
      <Avatar name='Ryan Florence' src='https://bit.ly/ryan-florence' />
      <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />
      <Avatar name='Kent Dodds' src='https://bit.ly/kent-c-dodds' />
      <Avatar name='Prosper Otemuyiwa' src='https://bit.ly/prosper-baba' />
      <Avatar name='Christian Nwamba' src='https://bit.ly/code-beast' />
    </AvatarGroup>
    )
  };

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
    { field: "title" },
    { field: "categories" },
    { field: "updatedAt" },
    { field: "testers", cellRenderer: TestersCell }
  ]);

  return (
    // wrapping container with theme & size
    <div
      className="ag-theme-quartz" // applying the grid theme
      style={{ height: 500 }} // the grid will fill the size of the parent container
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
      />
    </div>
  )
}