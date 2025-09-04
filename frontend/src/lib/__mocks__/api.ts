export const drugAPI = {
  searchDrugs: jest.fn().mockResolvedValue([]),
  getDrug: jest.fn().mockResolvedValue(null),
  getAllDrugs: jest.fn().mockResolvedValue([])
}