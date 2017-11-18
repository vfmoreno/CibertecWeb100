USE [Northwind_Lite]
GO
/****** Object:  StoredProcedure [dbo].[CustomerPagedList]    Script Date: 18/11/2017 2:17:36 a.m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[CustomerPagedList]
	@startRow int,
	@endRow int
AS
BEGIN
	WITH CustomerResult AS
	(
		SELECT [Id]
		  ,[FirstName]
		  ,[LastName]
		  ,[City]
		  ,[Country]
		  ,[Phone]
		  ,ROW_NUMBER() OVER (ORDER BY Id) AS RowNum
	  FROM .[dbo].[Customer]   
	)

	SELECT [Id]
		  ,[FirstName]
		  ,[LastName]
		  ,[City]
		  ,[Country]
		  ,[Phone]
	FROM CustomerResult
	WHERE RowNum BETWEEN @startRow AND @endRow;
END
