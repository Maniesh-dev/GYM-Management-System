'use client'
import { prisma } from '@/lib/db'
import { MemberForm } from './MemberForm'

interface Member {
  id:               string
  name:             string
  phone:            string
  email:            string | null
  dob:              Date   | null
  address:          string | null
  emergencyContact: string | null
  planId:           string
  trainerId:        string | null
  joinDate:         Date
}
interface Plan    { id: string; name: string; price: number; durationDays: number }
interface Trainer { id: string; name: string }

interface EditMemberFormProps {
  member:   Member
  plans:    Plan[]
  trainers: Trainer[]
}

export function EditMemberForm({
  member,
  plans,
  trainers,
}: EditMemberFormProps) {
  return (
    <MemberForm
      mode="edit"
      plans={plans}
      trainers={trainers}
      defaultValues={{
        id:               member.id,
        name:             member.name,
        phone:            member.phone,
        email:            member.email            ?? '',
        dob:              member.dob
                            ? new Date(member.dob).toISOString().split('T')[0]
                            : '',
        address:          member.address          ?? '',
        emergencyContact: member.emergencyContact ?? '',
        planId:           member.planId,
        trainerId:        member.trainerId         ?? '',
        joinDate:         new Date(member.joinDate).toISOString().split('T')[0],
      }}
    />
  )
}