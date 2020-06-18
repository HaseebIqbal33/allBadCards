import React from "react";
import {Button} from "@material-ui/core";
import {FaUpload} from "react-icons/all";
import {useDataStore} from "@Global/Utils/HookUtils";
import {PackCreatorDataStore} from "@Global/DataStore/PackCreatorDataStore";

export const JsonExport: React.FC = () =>
{
	const packData = useDataStore(PackCreatorDataStore);

	const exportToJson = (objectData: any) =>
	{
		let filename = "export.json";
		let contentType = "application/json;charset=utf-8;";
		if (window.navigator && window.navigator.msSaveOrOpenBlob)
		{
			var blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(objectData, null, 2)))], {type: contentType});
			navigator.msSaveOrOpenBlob(blob, filename);
		}
		else
		{
			var a = document.createElement('a');
			a.download = filename;
			a.href = 'data:' + contentType + ',' + encodeURIComponent(JSON.stringify(objectData, null, 2));
			a.target = '_blank';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	const exportClick = () => {
		exportToJson(packData);
	};

	return (
		<div style={{marginRight: "1rem"}}>
			<Button startIcon={<FaUpload/>} variant={"outlined"} onClick={exportClick}>
				Export to JSON
			</Button>
		</div>
	)
};