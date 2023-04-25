const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const APIFeatures = require("./../utils/apiFeatures");

const setNameData = (document, documentName) => {
  const data = {};
  data[documentName] = document;

  return data;
};

exports.getAll = (Model, documentName) =>
  catchAsync(async (request, response, next) => {
    request.findObject = request.findObject ?? {};

    // To allow for nested GET reviews on tour (hack)
    // const { tourId } = request.params;
    // const filter = tourId ? { tour: tourId } : {};

    const features = new APIFeatures(
      Model.find(request.findObject),
      request.query
    );
    features.filter().sort().limitFields().paginate();

    // const documents = await features.query.explain();
    const documents = await features.query;

    const data = setNameData(documents, documentName);

    response.status(200).json({
      status: "success",
      results: documents.length,
      data,
    });
  });

exports.getOne = (Model, documentName, populateOptions) =>
  catchAsync(async (request, response, next) => {
    let query = Model.findById(request.params.id);

    if (populateOptions) query = query.populate(populateOptions);

    // populateOptions.forEach((document) => {
    //   query = query.populate(document);
    // });

    const document = await query;

    if (!document)
      return next(new AppError(`No ${documentName} found with that ID`, 404));

    const data = setNameData(document, documentName);

    response.status(200).json({
      status: "success",
      data,
    });
  });

exports.createOne = (Model, documentName) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.create(request.body);
    const data = setNameData(document, documentName);

    // response.status(201).json({
    //   status: "success",
    //   data: {
    //     data: document,
    //   },
    // });

    response.status(201).json({
      status: "success",
      data,
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndDelete(request.params.id);

    if (!document) return next(new AppError("No tour found with that ID", 404));

    response.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model, documentName) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!document)
      return next(new AppError(`No ${documentName} found with that ID`, 404));

    const data = setNameData(document, documentName);

    response.status(200).json({
      status: "success",
      data,
    });
  });
