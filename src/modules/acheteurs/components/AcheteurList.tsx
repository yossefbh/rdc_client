import { useEffect, useState } from "react";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";
import { Acheteur } from "@/modules/acheteurs/types/Interface";
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export const AcheteurList = () => {
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);

  const refreshAcheteurs = async () => {
    try {
      const response = await fetch("https://localhost:7284/api/Acheteurs/Refresh");
      const text = await response.text();
      if (text === "Refreshed") {
        getAcheteurs().then(setAcheteurs).catch(console.error);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des acheteurs", error);
    }
  };

  useEffect(() => {
    getAcheteurs().then(setAcheteurs).catch(console.error);
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'nom',
      headerName: 'Nom',
      width: 220,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'prenom',
      headerName: 'Prénom',
      width: 230,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'adresse',
      headerName: 'Adresse',
      width: 270,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 300,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'telephone',
      headerName: 'Téléphone',
      width: 300,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={refreshAcheteurs}
          className="px-4 py-2 bg-green-700 text-amber-50 rounded hover:bg-green-400 cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <Box sx={{ height: '88vh', width: '100%' }} className="overflow-visible">
        <DataGrid
          rows={acheteurs}
          columns={columns}
          getRowId={(row) => row.acheteurID}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          filterMode="client"
          sortingMode="client"
          localeText={{
            noRowsLabel: "Aucun acheteur trouvé.",
          }}
          rowHeight={65}
          sx={{
            '& .MuiDataGrid-cell': {
              overflow: 'visible',
            },
            '& .MuiDataGrid-row': {
              overflow: 'visible',
            },
          }}
        />
      </Box>
    </div>
  );
};