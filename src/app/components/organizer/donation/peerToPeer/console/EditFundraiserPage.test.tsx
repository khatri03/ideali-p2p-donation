import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMyFundraisingPage } from '../peerToPeerTestFactory';

const getMyFundraisingPage = vi.fn();
const updateMyFundraisingPage = vi.fn();
const setMyFundraisingPhoto = vi.fn();
const removeMyFundraisingPhoto = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserConsoleService', () => ({
  getMyFundraisingPage: (...args: unknown[]) => getMyFundraisingPage(...args),
  updateMyFundraisingPage: (...args: unknown[]) => updateMyFundraisingPage(...args),
  setMyFundraisingPhoto: (...args: unknown[]) => setMyFundraisingPhoto(...args),
  removeMyFundraisingPhoto: (...args: unknown[]) => removeMyFundraisingPhoto(...args),
  fundraiserPhotoUrl: (id: string) => `/api/images/${id}.png`,
}));

const { default: EditFundraiserPageScreen } = await import('./EditFundraiserPage');

const PAGE_ID = '9a3c1f76-2c47-4b2c-9c0e-3f8d51f2b7aa';

const renderEditor = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[`/member/my-fundraising/${PAGE_ID}`]}>
        <Routes>
          <Route
            path="/member/my-fundraising/:fundraiserUniqueId"
            element={<EditFundraiserPageScreen />}
          />
          <Route path="/member/my-fundraising" element={<p>Console screen</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getMyFundraisingPage.mockReset();
  updateMyFundraisingPage.mockReset();
  setMyFundraisingPhoto.mockReset();
  removeMyFundraisingPhoto.mockReset();
  getMyFundraisingPage.mockResolvedValue(buildMyFundraisingPage());
});

describe('EditFundraiserPage', () => {
  it('Editor_Opened_PrefillsWhatIsAlreadyOnThePage', async () => {
    renderEditor();

    expect(await screen.findByLabelText(/Name on your page/i)).toHaveValue('Sarah Khan');
    expect(screen.getByLabelText(/Your goal/i)).toHaveValue('500');
    expect(screen.getByLabelText(/Why you are doing this/i)).toHaveValue(
      'My uncle walks four kilometres for water.',
    );
  });

  it('Editor_PageThatIsNotTheirs_ShowsADesignedRefusalRatherThanAnEmptyForm', async () => {
    getMyFundraisingPage.mockRejectedValue(new Error('Fundraising page not found.'));

    renderEditor();

    expect(await screen.findByText('This fundraising page is not here')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name on your page/i)).not.toBeInTheDocument();
  });

  it('Save_ValidChanges_AreSentAndConfirmed', async () => {
    updateMyFundraisingPage.mockResolvedValue(
      buildMyFundraisingPage({ displayName: 'Sara M', goal: 750 }),
    );

    renderEditor();

    const name = await screen.findByLabelText(/Name on your page/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Sara M');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(updateMyFundraisingPage).toHaveBeenCalledWith(
        PAGE_ID,
        expect.objectContaining({ displayName: 'Sara M' }),
      ),
    );
    expect(await screen.findByText('Your page is updated.')).toBeInTheDocument();
  });

  it('Save_EmptyName_ShowsTheFieldErrorAndSendsNothing', async () => {
    renderEditor();

    await userEvent.clear(await screen.findByLabelText(/Name on your page/i));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Enter the name to show on your fundraising page.'),
    ).toBeInTheDocument();
    expect(updateMyFundraisingPage).not.toHaveBeenCalled();
  });

  it('Save_GoalOfZero_ShowsTheFieldErrorAndSendsNothing', async () => {
    renderEditor();

    const goal = await screen.findByLabelText(/Your goal/i);
    await userEvent.clear(goal);
    await userEvent.type(goal, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Enter a goal greater than zero, or leave it blank.'),
    ).toBeInTheDocument();
    expect(updateMyFundraisingPage).not.toHaveBeenCalled();
  });

  it('Goal_Letters_AreNotAcceptedByTheFieldAtAll', async () => {
    renderEditor();

    const goal = await screen.findByLabelText(/Your goal/i);
    await userEvent.clear(goal);
    await userEvent.type(goal, 'lots of money');

    expect(goal).toHaveValue('');
  });

  it('Goal_TypedWithCurrencyAndGrouping_KeepsOnlyTheAmount', async () => {
    renderEditor();

    const goal = await screen.findByLabelText(/Your goal/i);
    await userEvent.clear(goal);
    await userEvent.type(goal, '$1,250.567');

    expect(goal).toHaveValue('1250.56');
  });

  it('Save_ApiRefusesTheChange_ShowsWhatTheApiSaidRatherThanClaimingSuccess', async () => {
    updateMyFundraisingPage.mockRejectedValue(new Error('Fundraising page not found.'));

    renderEditor();

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Fundraising page not found.')).toBeInTheDocument();
    expect(screen.queryByText('Your page is updated.')).not.toBeInTheDocument();
  });

  it('Photo_ChosenImage_IsUploadedAndThePageIsReadBack', async () => {
    setMyFundraisingPhoto.mockResolvedValue('photo-unique-id');
    getMyFundraisingPage.mockResolvedValue(buildMyFundraisingPage({ photoUniqueId: null }));

    const { container } = renderEditor();

    await screen.findByRole('button', { name: 'Upload a photo' });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, new File(['binary'], 'portrait.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(setMyFundraisingPhoto).toHaveBeenCalled());
    expect(getMyFundraisingPage).toHaveBeenCalledTimes(2);
  });

  it('Photo_FileOfTheWrongType_IsRefusedInTheBrowserWithoutAnUpload', async () => {
    getMyFundraisingPage.mockResolvedValue(buildMyFundraisingPage({ photoUniqueId: null }));

    const { container } = renderEditor();

    await screen.findByRole('button', { name: 'Upload a photo' });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    // Fired directly rather than through userEvent: the accept attribute stops the picker offering a
    // PDF at all, and what is under test is the guard behind it, which a determined browser can reach.
    fireEvent.change(input, {
      target: { files: [new File(['binary'], 'cv.pdf', { type: 'application/pdf' })] },
    });

    expect(
      await screen.findByText('Choose a JPG, PNG or WEBP image of 5 MB or less.'),
    ).toBeInTheDocument();
    expect(setMyFundraisingPhoto).not.toHaveBeenCalled();
  });

  it('Photo_PageWithAPhoto_OffersToRemoveIt', async () => {
    removeMyFundraisingPhoto.mockResolvedValue(undefined);
    getMyFundraisingPage.mockResolvedValue(buildMyFundraisingPage({ photoUniqueId: 'photo-id' }));

    renderEditor();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove photo' }));

    await waitFor(() => expect(removeMyFundraisingPhoto).toHaveBeenCalledWith(PAGE_ID));
  });

  it('Leave_UnsavedChanges_AsksBeforeThrowingThemAway', async () => {
    const confirmed = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderEditor();

    await userEvent.type(await screen.findByLabelText(/Name on your page/i), ' extra');
    await userEvent.click(screen.getByRole('button', { name: 'Back to my fundraising' }));

    expect(confirmed).toHaveBeenCalled();
    expect(screen.queryByText('Console screen')).not.toBeInTheDocument();

    confirmed.mockRestore();
  });

  it('Leave_NothingChanged_GoesStraightBackWithoutAsking', async () => {
    const confirmed = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderEditor();

    await userEvent.click(await screen.findByRole('button', { name: 'Back to my fundraising' }));

    expect(confirmed).not.toHaveBeenCalled();
    expect(await screen.findByText('Console screen')).toBeInTheDocument();

    confirmed.mockRestore();
  });
});
