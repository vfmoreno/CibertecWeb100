USE [Northwind_Lite]
GO

CREATE PROCEDURE [dbo].[SupplierPagedList]
	@startRow int,
	@endRow int
AS
BEGIN
	SELECT [Id]
	 ,[CompanyName]
	 ,[ContactName]
	 ,[ContactTitle]
	 ,[City]
	 ,[Country]
	 ,[Phone]
	 ,[Fax]
	FROM (
		SELECT
			ROW_NUMBER() OVER ( ORDER BY Id ) AS RowNum
			,[Id]
			,[CompanyName]
			,[ContactName]
			,[ContactTitle]
			,[City]
			,[Country]
			,[Phone]
			,[Fax]
		 FROM [dbo].[Supplier]
		) AS RowConstrainedResult
	WHERE RowNum >= @startRow
	  AND RowNum <= @endRow
	ORDER BY RowNum
END
GO

CREATE PROCEDURE [dbo].[OrderPagedList]
	@startRow int,
	@endRow int
AS
BEGIN
	SELECT
		[Id]
		,[OrderDate]
		,[OrderNumber]
		,[CustomerId]
		,[TotalAmount]
	FROM (
		SELECT
			ROW_NUMBER() OVER ( ORDER BY Id ) AS RowNum
			,[Id]
			,[OrderDate]
			,[OrderNumber]
			,[CustomerId]
			,[TotalAmount]
		 FROM [dbo].[Order]
		) AS RowConstrainedResult
	WHERE RowNum >= @startRow
	  AND RowNum <= @endRow
	ORDER BY RowNum
END
GO

CREATE PROCEDURE [dbo].[OrderItemPagedList]
	@startRow int,
	@endRow int
AS
BEGIN
	SELECT
		[Id]
		,[OrderId]
		,[ProductId]
		,[UnitPrice]
		,[Quantity]
	FROM (
		SELECT
			ROW_NUMBER() OVER ( ORDER BY Id ) AS RowNum
			,[Id]
			,[OrderId]
			,[ProductId]
			,[UnitPrice]
			,[Quantity]
		 FROM [dbo].[OrderItem]
		) AS RowConstrainedResult
	WHERE RowNum >= @startRow
	  AND RowNum <= @endRow
	ORDER BY RowNum
END
GO

CREATE PROCEDURE [dbo].[UserPagedList]
	@startRow int,
	@endRow int
AS
BEGIN
	SELECT [Id]
		,[Email]
		,[FirstName]
		,[LastName]
		,'' as [Password]
		,[Roles]
	FROM (
		SELECT
			ROW_NUMBER() OVER ( ORDER BY Id ) AS RowNum
			,[Id]
			,[Email]
			,[FirstName]
			,[LastName]
			,[Roles]
		 FROM [dbo].[User]
		) AS RowConstrainedResult
	WHERE RowNum >= @startRow
	  AND RowNum <= @endRow
	ORDER BY RowNum
END
GO